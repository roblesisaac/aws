const jwt = require('jsonwebtoken');
const models = { sheets: require('./models/sheets'), sites: require('./models/sites'), users: require('./models/users') };
const mongoose = require('mongoose');
const db = mongoose.connection;
const aws = require('aws-sdk');
const spacesEndpoint = new aws.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: 'TD5OCO2KT5KMS2R6WVEJ',
  secretAccessKey: '7LhKRchX6rVVGL0V1fRlnkmrVUABZx4C8Q/QsUrGkNA'
});
const multer = require('multer');
const multerS3 = require('multer-s3');
mongoose.Promise = global.Promise;
let isConnected;
const sessionModels = {};
const types = { 'string': String, 'number': Number, 'date': Date, 'boolean': Boolean, 'array': Array };
const reserved = ['on', 'emit', '_events', 'db', 'get', 'set', 'init', 'isNew', 'errors', 'schema', 'options', 'modelName','_pres', '_posts', 'toObject'];
const fs = require('fs');
const tmplts = {};
const first = require('./default');

if(!tmplts.index) {
  fs.readdir('./templates', function (err, data) {
    for (i=0; i<data.length; i++) tmplts[data[i].slice(0,-5)] = fs.readFileSync('./templates/' + data[i], 'utf8');
  });
}

const res = {
  body: function(callback, body, contentType) {
    const o = { statusCode: 200, body: body };
    if(contentType) o.headers = { 'Content-Type': contentType };
    callback(null, o); 
  },
  error: function(callback, err) {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        error: err
      })
    }); 
  }  
};

const ply = {
  api: function(event, context, send) {
    const o = ply.prep(event, context);
    const siteName = o.site;
    const sheetName = o.arg1;
    const id = o.arg2;
    let parameters = o.query || {};
    ply.getModel(siteName, sheetName, o.event, function(err, model, sheet, site) {
      if(err) {
        send(err);
      } else {
        const method = {
          get: function() {
            // db.inventory.find( { sku: { $regex: /789$/ } } );
            function doSomethingTo(key) {
              const filterMethods = {
                limit: function() {
                  return parameters[key]*1;
                },
                skip: function() {
                  return parameters[key]*1;
                }
              };
              if(filterMethods[key]) {
                return filterMethods[key]();
              } else {
                return parameters[key];
              }
            }
            function pullOutKeysFromParams(keys, next) {
              const filters = {};
              function keyIsSpecial(key) {
                return keys.indexOf(key) > -1;
              }
              for(var key in parameters) {
                if(keyIsSpecial(key)) {
                  filters[key] = doSomethingTo(key);
                  delete parameters[key];
                }
              }
              next(parameters, filters);
            }
            function queryPropIsARegex(prop, queryObj) {
              return queryObj[prop].indexOf(queryObj[prop]) !== -1;
            }
            function createRegObj(prop, queryObj) {
              queryObj[prop] = { $regex: /queryObj[prop]/ };
            }
            function createFindFn(param, next) {
              let modelMethod = 'find';
              if(sheetName === 'sheets') param.siteId = site._id;
              if(id) {
                modelMethod = 'findById';
                param = id;
              }
              for(var queryProp in param) {
                if(queryPropIsARegex(queryProp, param)) createRegObj(queryProp, param);
              }
              next(model[modelMethod](param));
            }
            function attachFiltersToFind(find, filters, next) {
              if(!filters.limit) filters.limit = 50;
              for(var key in filters) find = find[key](filters[key]);
              next(find);
            }
            
            pullOutKeysFromParams(['limit', 'select', 'skip', 'sort'], function(params, mongoFilters) {
              createFindFn(params, function(find) {
                attachFiltersToFind(find, mongoFilters, function(findFn) {
                  findFn.then(function(data){
                    send(null, JSON.stringify(data));
                  });
                });
              });
            });
            
          },
          put: function() {
            model.findByIdAndUpdate(id, JSON.parse(event.body), { new: true }).then(function(data){
              send(null, JSON.stringify(data));
            });            
          },
          post: function() {
            model.create(JSON.parse(event.body)).then(function(data){
              send(null, JSON.stringify(data));
            });             
          },
          delete: function() {
            model.findByIdAndRemove(id).then(function(data){
              send(null, JSON.stringify(data));
            });            
          }
        };
        method[o.event.httpMethod.toLowerCase()]();
      }
    });
  },
  connect: function() {
    if (isConnected) return Promise.resolve();
    return mongoose.connect(process.env.DB).then(function(database){
      isConnected = database.connections[0].readyState;
    }); 
  },
  checkIfSheetIsPublic: function(sheet, event, next) {
    if(sheet.public) return next(null, sheet);
    this.checkToken(event, function(err, decoded) {
      if(err) return next(err);
      next(null, sheet);
    });    
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
    if(sessionModels[sheet._id]) {
      if(next) next(sessionModels[sheet._id]);
    } else {
      let options = {
        strict: true,
        collection: sheet.siteId+'_'+sheet.name+'_'+JSON.stringify(sheet._id)
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
      if(next) next(sessionModels[sheet._id]);
    }
  },
  dbBulkUpload: function(event, context, send) {
    var o = ply.prep(event, context),
        obj = JSON.parse(o.event.body),
        col = obj.collection,
        data = obj.jsonParsed;
    if (col && data) {
      db.collection(col).insertMany(JSON.parse(data), function(err, doc) {
        if(err) res.send(err);
        send(null, JSON.stringify(doc));
      });
    } else {
      send('Error uploading json.');
    }
  },
  dbCount: function(event, context, send) {
    const o = ply.prep(event, context);
    const siteName = o.site;
    const sheetName = o.arg1;
    ply.getModel(siteName, sheetName, o.event, function(err, model, sheet, site){
      if(err) return send(err);
      model.count({}, function(countErr, count){
        if(countErr) return send(countErr);
          send(null, count);
      });
    });
  },
  dbDrop: function(event, context, send) {
    const o = ply.prep(event, context);
    const siteName = o.site;
    const sheetName = o.arg1;
    ply.getModel(siteName, sheetName, event, function(err, model, sheet, site){
      model.remove({}, function(err) { 
         send(null, 'collection removed') 
      }); 
    });
  },
  findSheet: function(siteName, sheetName, next) {
    models.sites.findOne({ url: siteName }).then(function(site){
      if(!site) return next(siteName + ' plysheet not found.');
      models.sheets.findOne({ siteId: site._id, name: sheetName }).then(function(sheet){
        if(!sheet) {
          if(sheetName === 'sheets') {
            models.sheets.create(first.sheet(site)).then(function(data){
              next(null, data, site);
            });            
          } else {
            return next(siteName + ' plysheet found but no ' + sheetName + ' sheet found.');
          }
        };
        next(null, sheet, site);
      });
    });     
  },
  getModel: function(siteName, sheetName, event, next) {
    var vm = this;
    vm.findSheet(siteName, sheetName, function(err1, sheet, site){
      if(err1) return next(err1);
      if(['sites', 'users', 'sheets'].indexOf(sheetName) > -1) {
        next(null, models[sheetName], sheet, site);
      } else {
        vm.checkIfSheetIsPublic(sheet, event, function(err2, sheet) {
          if(err2) return next(err2);
          vm.createModelFromSheet(sheet, function(model){
            next(null, model, sheet, site);
          });      
        }); 
      }
    });
  },
  landing: function(event, context, send) {
    var vm = this;
    let siteUrl = 'plysheet';
    if (event.pathParameters && event.pathParameters.site) {
      siteUrl = event.pathParameters.site;
    }
    function checkForSheets(site, next) {
      models.sheets.find({siteId: site._id}).then(function(sheets){
        if(sheets && sheets.length > 0) {
          next(sheets);
        } else {
          models.sheets.create(first.sheet(site)).then(function(data){
            next(data);
          });
        }
      });          
    }
    models.sites.findOne({url: siteUrl}).then(function(site){
      if(site) {
        checkForSheets(site, function(sheets) {
          var data = {
            site: site,
            user: {},
            sheets: sheets,
            link: sheets[0].name
          };
          let index = fs.readFileSync('./templates/index.html', 'utf8');
          index = index.replace(new RegExp('{{siteUrl}}', 'g'), siteUrl);
          index = index.replace('{{data}}', JSON.stringify(data));
          send(null, index, 'text/html');          
        });
      } else {
        send(null, `<h1>No ${siteUrl} exists</h1>`, 'text/html');
      }
    });
  },
  login: function(event, context, send) {
    const user = JSON.parse(event.body);
  	models.users.findOne({username: user.username}, function(err, foundUser) {
  		if (err) return send(err);
  		if (!foundUser) {
  			send(user.username + ' not found');
  		} else if (foundUser) {
  			foundUser.comparePassword(user.password, function(err2, isMatch) {
  				if(isMatch && isMatch === true) {
  					send(null, JSON.stringify({
  					  token: jwt.sign({ _id: foundUser._id, username: foundUser.username, name: foundUser.name,	password: foundUser.password	}, foundUser.password, {	expiresIn: '15h' }),
  					  userid: foundUser._id
  					}));
  				} else {
  					send('Authentication failed. Wrong password.');
  				}
  			});
  		}
  	});
  },
  prep: function(event, context) {
    const params = event.pathParameters;
    return {
      site: params.site,
      method: params.method,
      arg1: params.arg1,
      arg2: params.arg2,
      query: event.queryStringParameters || {},
      event: event,
      context: context
    }
  },
  setup: function(event, context, send) {
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
          send(null, JSON.stringify({
            user: user,
            site: site,
            sheet: sheet
          }));
        });
      });
    });
  },
  static: function(event, context, send) {
    const o = ply.prep(event, context);
    const prop = o.arg1;
    const isReady = (body) => {
      return ['object', 'array'].indexOf(typeof body) === -1;
    };
    const createQueryFilterObjFrom = (queryStringParameters, next) => {
      let q = queryStringParameters || {};
      let s = q.select || 'selector is not defined';
      let t = q.type || 'application/javascript';
      q.name = o.arg2;
      delete q.select;
      delete q.type;
      next(q, s, t);
    };
    const findAMatch = (arr, query, next) => {
      let match = {};
      for(var i=0; i<arr.length; i++) {
        let item = arr[i];
        let matches = [];
        for(var key in query) matches.push(item[key] === query[key]);
        if(matches.indexOf(false) === -1) { 
          i=arr.length;
          match = item;
        }
      }
      next(match);
    };
    const getObjFrom = (body, query, next) => {
      if(Array.isArray(body)) {
        findAMatch(body, query, function(obj){
          next(obj);
        });
      } else {
        next(body);
      }
    };
    ply.findSheet(o.site, 'sheets', function(err, sheet) {
      if(err) return send(err);
      const body = sheet[prop];
      if(isReady(body)) {
        send(null, body, 'application/javascript');
      } else if(o.query.select) {
        createQueryFilterObjFrom(o.query, function(query, select, type) {
          getObjFrom(body, query, function(obj) {
            if(query.name.includes('css')) type = 'text/css';
            send(null, obj[select] || JSON.stringify({
              query: query,
              select: select,
              body: obj
            }), type);
          }); 
        });
      } else {
        send(null, JSON.stringify(body));
      }
    });
  },
  upload: function(event, context, send) {
    const upload = multer({
      storage: multerS3({
        s3: s3,
        bucket: 'plysheet',
        acl: 'public-read',
        key: function (request, file, cb) {
          cb(null, file.originalname);
        }
      })
    }).array('upload', 1);
    upload(event, context, function (error) {
      if (error) {
        return send("/error");
      }
      send(null, JSON.stringify(event));
    });
    // var params = {
    //     Bucket: 'plysheet'
    // };
    // s3.listObjectsV2(params, function (err, data) {
    //   if (!err) {
    //     send(null, JSON.stringify(data));
    //   } else {
    //     console.log(err);  // an error ocurred
    //   }
    // });
  }
};

module.exports.port = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  event.pathParameters = event.pathParameters || {};
  const params = event.pathParameters || {};
  const fn = ply[params.method] || ply.landing;
  return ply.connect().then(function(){
    fn(event, context, function(err, body, contentType) {
      if(err) return res.error(callback, err);
      res.body(callback, body, contentType);
    }, callback);
  });
}
