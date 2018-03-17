const connectToDb = require('./db');
const mongoose = require('mongoose');
const checkToken = require('./auth').checkToken;
const models = {
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
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
};

const findSheet = (event, context, next) => {
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
            next(null, sheet);
          });
      });
  });   
};

const checkIfSheetIsPublic = (event, context, sheet, next) => {
  if(sheet.public) {
    next(null, sheet);
  } else {
    checkToken(event, context, (res) => {
      if(res.success === true) return next(null, sheet);
      next(res.message);
    });
  }
};

const getModel = (event, context, next) => {
  findSheet(event, context, function(err1, sheet){
    if(err1) return next(err1);
    checkIfSheetIsPublic(event, context, sheet, function(err2, sheet) {
      if(err2) return next(err2);
        createModelFromSheet(sheet, function(model){
          next(null, model);
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

module.exports.component = (event, context, callback) => {
  findSheet(event, context, function(err, sheet){
    if(err) return printError(callback, err);
    const body = sheet[event.pathParameters.prop] || 'no ' + event.pathParameters.prop;
    let arr = [];
    for(var key in sheet) arr.push(key);
    arr.push(sheet);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(mongoose.connection)
    });
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
    let params = event.queryStringParameters || {};
    model.find(params)
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

module.exports.delete = (event, context, callback) => {
  getModel(event, context, function(error, model) {
    if(error) return printError(callback, error);
      model.findByIdAndRemove(event.pathParameters.id)
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
      .catch(err => callback(null, err)); 
  });
};
