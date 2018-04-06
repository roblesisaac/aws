const jwt = require('jsonwebtoken');
const models = { sites: require('./models/sites'), sheets: require('./models/sheets'), users: require('./models/users') };
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
let isConnected;
const sessionModels = {};
const types = { 'string': String, 'number': Number, 'date': Date, 'boolean': Boolean, 'array': Array };
const reserved = ['on', 'emit', '_events', 'db', 'get', 'set', 'init', 'isNew', 'errors', 'schema', 'options', 'modelName','_pres', '_posts', 'toObject'];
const fs = require('fs');
const tmplts = {};

if(!tmplts.index) {
  fs.readdir('./templates', function (err, data) {
    for (i=0; i<data.length; i++) tmplts[data[i].slice(0,-5)] = fs.readFileSync('./templates/' + data[i], 'utf8');
  });
}

const ply = {
  api: function(event, context, callback) {
    const siteName = event.pathParameters.site;
    const sheetName = event.pathParameters.arg1;
    const id = event.pathParameters.arg2;
    let params = event.queryStringParameters || {};
    ply.getModel(siteName, sheetName, event, function(err, model) {
      if(err) {
        ply.error(callback, err);
      } else {
        const method = {
          get: function() {
            let modelMethod = 'find';
            if(id) {
              modelMethod = 'findById';
              params = id;
            }
            model[modelMethod](params).then(function(data){
              ply.res(callback, JSON.stringify(data));
            });
          },
          put: function() {
            model.findByIdAndUpdate(id, JSON.parse(event.body), { new: true }).then(function(data){
              ply.res(callback, JSON.stringify(data));
            });            
          },
          post: function() {
            model.create(JSON.parse(event.body)).then(function(data){
              ply.res(callback, JSON.stringify(data));
            });             
          },
          delete: function() {
            model.findByIdAndRemove(id).then(function(data){
              ply.res(callback, JSON.stringify(data));
            });            
          }
        };
        method[event.httpMethod.toLowerCase()]();
      }
    });
  },
  connect: function(context) {
    if(context) context.callbackWaitsForEmptyEventLoop = false;
    if (isConnected) {
      return Promise.resolve();
    } else {
      return mongoose.connect(process.env.DB).then(function(db){
        isConnected = db.connections[0].readyState;
      }); 
    }
  },
  checkIfSheetIsPublic: function(sheet, event, next) {
    if(sheet.public) {
      next(null, sheet);
    } else {
      this.checkToken(event, function(err, decoded) {
        if(err) return next(err);
        next(null, sheet);
      });
    }      
  },
  checkToken: function(event, next) {
    const token = event.headers.token;
    const userid = event.headers.userid;
    if(!token || !userid) return next('No token or userid provided');
  	models.users.findById(userid, (err, user) => {
  		if(!user) return next('no user found with this id: '+userid);
      jwt.verify(token, user.password, (err2, decoded) => {
  			if (err2) {
  				next('You are logged out with this error: '+ err2);
  			} else {
  				next(null, decoded);
  			}
  		});
  	}); 
  },
  createModelFromSheet: function(sheet, next) {
    if(sessionModels[sheet._id]) return next(sessionModels[sheet._id]);
    let options = {
      strict: true,
      collection: sheet.name || sheet.url || JSON.stringify(sheet._id)
    };
    let schema = {};
    let arr = sheet._schema || [{}];
    for(var s in arr) {
      let obj = arr[s] || {};
      obj.propName = obj.propName || 'propName';
      obj.propType = (obj.propType || 'string').toLowerCase();
      if(options[obj.propName]) {
        options[obj.propName] = obj.propType;
      } else if(reserved.indexOf(obj.propName) === -1) {
        schema[obj.propName] = types[obj.propType] || String;
      }
    }
    sessionModels[sheet._id] = mongoose.model(options.collection, new mongoose.Schema(schema, options));
    next(sessionModels[sheet._id]);    
  },
  error: function(callback, err) {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        error: err
      })
    }); 
  },
  findSheet: function(siteName, sheetName, next) {
    models.sites.findOne({ url: siteName }).then(function(site){
      if(!site) return next(siteName + ' plysheet not found.');
      models.sheets.findOne({ siteId: site._id, name: sheetName }).then(function(sheet){
        if(!sheet) return next(siteName + ' plysheet found but no ' + sheetName + ' sheet found.');
        next(null, sheet);
      });
    });     
  },
  getModel: function(siteName, sheetName, event, next) {
    var vm = this;
    vm.findSheet(siteName, sheetName, function(err1, sheet){
      if(err1) return next(err1);
      vm.checkIfSheetIsPublic(sheet, event, function(err2, sheet) {
        if(err2) return next(err2);
        vm.createModelFromSheet(sheet, function(model){
          next(null, model);
        });      
      });
    });
  },
  landing: function(event, context, callback) {
    let siteUrl = 'plysheet';
    if (event.pathParameters && event.pathParameters.site) {
      siteUrl = event.pathParameters.site;
    }
    models.sites.findOne({url: siteUrl}).then(function(site){
      if(site) {
        models.sheets.find({siteId: site._id}).then(function(sheets){
          var data = {
            site: site,
            user: {},
            sheets: sheets,
            link: sheets[0].name
          };
          tmplts.index = tmplts.index.replace('{{siteUrl}}', siteUrl);
          tmplts.index = tmplts.index.replace('{{data}}', JSON.stringify(data));
          ply.res(callback, tmplts.index, 'text/html');
        });
      } else {
        ply.res(callback, `<h1>No ${siteUrl} exists</h1>`, 'text/html');
      }
    });
  },
  login: function(user, next) {
  	models.users.findOne({username: user.username}, function(err, foundUser) {
  		if (err) return next(err);
  		if (!foundUser) {
  			next(user.username + ' not found');
  		} else if (foundUser) {
  			foundUser.comparePassword(user.password, function(err2, isMatch) {
  				if(isMatch && isMatch === true) {
  					next(null, {
  					  token: jwt.sign({ _id: foundUser._id, username: foundUser.username, name: foundUser.name,	password: foundUser.password	}, foundUser.password, {	expiresIn: '15h' }),
  					  userid: foundUser._id
  					});
  				} else {
  					next('Authentication failed. Wrong password.');
  				}
  			});
  		}
  	});
  },
  res: function(callback, body, contentType) {
    let res = { statusCode: 200, body: body };
    if(contentType) res.headers = { 'Content-Type': contentType };
    callback(null, res); 
  },
  setup: function(event, context, callback) {
    const first = require('./default');
    function areThereAnyYet(name, data, next) {
      models[name].find().then(function(res) {
        if(res.length === 0) {
          createFirst(name, data, function(firstItem) {
            next(firstItem);
          });
        } else {
          next(res[0]);
        }
      });      
    }
    function createFirst(name, data, next) {
      models[name].create(data).then(function(res){
        next(res);
      });
    }
    areThereAnyYet('users', first.user(), function(user){
      areThereAnyYet('sites', first.site(user), function(site) {
        areThereAnyYet('sheets', first.sheet(site), function(sheet){
          ply.res(callback, JSON.stringify({
            user: user,
            site: site,
            sheet: sheet
          }));
        });
      });
    });
  }
};

module.exports.port = function(event, context, callback) {
  const params = event.pathParameters || {};
  const fn = ply[params.method] || ply.landing;
  ply.connect(context).then(function(){
    fn(event, context, callback);
  });
}
