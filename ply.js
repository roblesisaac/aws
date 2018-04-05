const DB = process.env.DB;
const jwt = require('jsonwebtoken');
const models = {
  sites: require('./models/sites'),
  sheets: require('./models/sheets'),
  users: require('./models/users')
};
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
let isConnected;
const sessionModels = {};
const types = {
  'string': String,
  'number': Number,
  'date': Date,
  'boolean': Boolean,
  'array': Array
};
const reserved = ['on', 'emit', '_events', 'db', 'get', 'set', 'init', 'isNew', 'errors', 'schema', 'options', 'modelName','_pres', '_posts', 'toObject'];
const fs = require('fs');
const tmplts = {};

if(!tmplts.index) {
  fs.readdir('./templates', function (err, data) {
    for (i=0; i<data.length; i++) tmplts[data[i].slice(0,-5)] = fs.readFileSync('./templates/' + data[i], 'utf8');
  });
}

const ply = {
  connect: function(context) {
    if(context) context.callbackWaitsForEmptyEventLoop = false;
    if (isConnected) {
      return Promise.resolve();
    }
    return mongoose.connect(DB)
      .then(db => { 
        isConnected = db.connections[0].readyState;
      });    
  },
  checkIfSheetIsPublic: function(event, context, sheet, next) {
    if(sheet.public) {
      next(null, sheet);
    } else {
      const token = event.headers.token;
      const userId = event.headers.userid;
      this.checkToken(context, token, userId, function(err, decoded) {
        if(err) {
          next(err);
        } else {
          next(null, sheet);
        }
      });
    }      
  },
  checkToken: function(context, token, userid, next) {
    if(!token || !userid) return next('No token or userid provided');
    this.connect(context).then(function(){
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
  findSheet: function(event, context, next) {
    var query = event.pathParameters;
    this.connect(context).then(() => {
      // get site
      models.sites.findOne({ url: query.site }).then(function(site){
        if(!site) return next(query.site + ' plysheet not found.');
        models.sheets.findOne({ siteId: site._id, name: query.sheet }).then(function(sheet){
          if(!sheet) return next(query.site + ' plysheet found but no ' + query.sheet + ' sheet found.');
          next(null, sheet);
        });
      });
    });      
  },
  getModel: function(event, context, next) {
    var vm = this;
    vm.findSheet(event, context, function(err1, sheet){
      if(err1) return next(err1);
      vm.checkIfSheetIsPublic(event, context, sheet, function(err2, sheet) {
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
    ply.connect(context).then(function(){
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
    });
  },
  login: function(context, user, next) {
    this.connect(context).then(function(){
    	models.users.findOne({username: user.username}, function(err, foundUser) {
    		if (err) {
    		  next(err);
    		  return;
    		}
    		if (!foundUser) {
    			next(user.username + ' not found');
    		} else if (foundUser) {
    			foundUser.comparePassword(user.password, function(err2, isMatch){
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
    });
  },
  res: function(callback, body, contentType) {
    let res = { statusCode: 200, body: body };
    if(contentType) res.headers = { 'Content-Type': contentType };
    callback(null, res); 
  },
  sheets: function(event, context, callback) {
    ply.res(callback, 'test five');
  }
};

module.exports.port = function(event, context, callback) {
  if(ply[(event.pathParameters || {}).method]) {
    ply[(event.pathParameters || {}).method](event, context, callback);
  } else {
    ply.landing(event, context, callback); 
  } 
}
