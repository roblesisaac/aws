const connectToDb = require('./db');
const mongoose = require('mongoose');
const checkToken = require('./auth').checkToken;
const models = {
  users: require('./models/users'),
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

var setup = function(event, context, fn) {
  context.callbackWaitsForEmptyEventLoop = false;
  var site = {
    name: event.pathParameters.sitename,
    sheet: event.pathParameters.sheet,
    model: models[event.pathParameters.sheet] || mongoose.model(url, new mongoose.Schema({name: String},{strict: false})),
    err: {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Could not create the note.'      
    }
  };
  connectToDb().then(() => fn(site));  
};

const sessionModels = {};
const types = {
  'string': String,
  'number': Number,
  'date': Date,
  'boolean': Boolean,
  'array': Array
};
const reserved = ['on', 'emit', '_events', 'db', 'get', 'set', 'init', 'isNew', 'errors', 'schema', 'options', 'modelName','_pres', '_posts', 'toObject'];

const createModelFromSheet = (sheet, next) => {
  if(sessionModels[sheet._id]) return next(sessionModels[sheet._id]);
  let options = {
    strict: false,
    collection: (sheet.name || sheet.url || JSON.stringify(sheet._id))
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
};

const getModel = (event, context, next) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const path = { url: event.pathParameters.sitename, sheet: event.pathParameters.sheet };
  connectToDb().then(() => {
    // get site
    models.sites.findOne({ url: path.url })
      .then(site => {
        if(!site) return next(path.url + ' plysheet not found.');
        //get sheet
        models.sheets.findOne({ siteId: site._id, name: path.sheet })
          .then(sheet => {
            if(!sheet) return next(path.url + ' plysheet found but no ' + path.sheet + ' sheet found.');
            if(sheet.public) {
              createModelFromSheet(sheet, function(model){
                next(null, model);
              });
            } else {
              checkToken(event, context, (res) => {
                if(res.success === true) {
                  createModelFromSheet(sheet, function(model){
                    next(null, model);
                  });
                } else {
                  next(res.message);
                }
              });
            }
          });
      });
  });  
};

const printError = (callback, error) => {
  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({ error: error })    
  });
};

module.exports.test = (event, context, callback) => {
  getModel(event, context, function(error, model) {
    if(error) return printError(callback, error);
    model.find({})
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, err)); 
  });
};

module.exports.auth = (event, context, callback) => {
  const response = { statusCode: 200 };
  checkToken(event, context, (res) => {
    response.body = JSON.stringify(res);
    callback(null, response);
  });
};

module.exports.post = (event, context, callback) => {
  getModel(event, context, function(error, model) {
    if(error) return printError(callback, error);
    model.create(JSON.parse(event.body))
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, err)); 
  });
};

module.exports.get = (event, context, callback) => {
  getModel(event, context, function(error, model) {
    if(error) return printError(callback, error);
    model.find({})
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, err)); 
  });
};

module.exports.getOne = (event, context, callback) => {
  getModel(event, context, function(error, model) {
    if(error) return printError(callback, error);
    model.findById(event.pathParameters.id)
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, err)); 
  });
};

module.exports.put = (event, context, callback) => {
  getModel(event, context, function(error, model) {
    if(error) return printError(callback, error);
      model.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true })
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
      .catch(err => callback(null, err)); 
  });
};

// module.exports.delete = (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false;

//   connectToDb()
//     .then(() => {
//       models.note.findByIdAndRemove(event.pathParameters.id)
//         .then(note => callback(null, {
//           statusCode: 200,
//           body: JSON.stringify({ message: 'Removed note with id: ' + note._id, note: note })
//         }))
//         .catch(err => callback(null, {
//           statusCode: err.statusCode || 500,
//           headers: { 'Content-Type': 'text/plain' },
//           body: 'Could not fetch the notes.'
//         }));
//     });
// };
