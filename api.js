const mongoose = require('mongoose');
const ply = require('ply');
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

const checkIfSheetIsPublic = (event, context, sheet, next) => {
  if(sheet.public) {
    next(null, sheet);
  } else {
    const token = event.headers.token;
    const userId = event.headers.userid;
    ply.checkToken(context, token, userId, function(err, decoded) {
      if(err) {
        next(err);
      } else {
        next(null, sheet);
      }
    });
  }
};

const getModel = (event, context, next) => {
  ply.findSheet(event, context, function(err1, sheet){
    if(err1) return next(err1);
    checkIfSheetIsPublic(event, context, sheet, function(err2, sheet) {
      if(err2) return next(err2);
        createModelFromSheet(sheet, function(model){
          next(null, model);
        });      
    });
  });
};
      
module.exports.sheetProp = (event, context, callback) => {
  // define the functions
  const res = (string, isCss) => {
    let type;
    isCss ? type = 'text/css' : type = 'application/javascript';
    callback(null, {
      statusCode: 200,
      headers: { 'Content-Type': type },
      body: (string || "").toString()
    });       
  };
  const isReady = (body) => {
    return ['object', 'array'].indexOf(typeof body) === -1;
  };
  const createQueryFilterObjFrom = (queryStringParameters, next) => {
    let q = queryStringParameters || {};
    let s = q.select || 'selector is not defined';
    delete q.select;
    next(q, s);
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
  //execute the functions
  ply.findSheet(event, context, function(err, sheet){
    if(err) return ply.error(callback, err);
    const propRaw = event.pathParameters.prop;
    const prop = propRaw.split('?')[0];
    const body = sheet[prop] || 'no ' + prop;
    if(isReady(body)) {
      res(body);
    } else {
      const queryStringParameters = event.queryStringParameters;
      createQueryFilterObjFrom(queryStringParameters, function(query, select) {
        getObjFrom(body, query, function(obj) {
          let isCss;
          if(query.name.includes('css')) isCss = true;
          res(obj[select] || JSON.stringify({
            query: query,
            select: select,
            body: obj
          }), isCss);
        }); 
      });
    }
  });
};

module.exports.sheets = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    body: ply.sheets()
  });
};

module.exports.post = (event, context, callback) => {
  getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
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
    if(error) return ply.error(callback, error);
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
    if(error) return ply.error(callback, error);
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
    if(error) return ply.error(callback, error);
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
    if(error) return ply.error(callback, error);
      model.findByIdAndRemove(event.pathParameters.id)
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
      .catch(err => callback(null, err)); 
  });
};
