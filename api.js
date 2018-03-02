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
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Could not create the note.'      
    }
  };
  connectToDb().then(() => fn(site));  
};

const sessionModels = {};

const createModelFromSheet = (sheet, next) => {
  // const types = {
  //   'string': String,
  //   'number': Number,
  //   'date': Date,
  //   'buffer': Buffer,
  //   'boolean': Boolean,
  //   'mixed': Mixed,
  //   'objectid': Objectid,
  //   'array': Array
  // };
  const options = {
    strict: true,
    collection: (sheet.name || sheet.url || JSON.stringify(sheet._id))
  };
  if(sessionModels[options.collection]) return next(sessionModels[options.collection]);
  // const arr = sheet._schema || [{}];
  // let schema = {};
  // for(var s in arr) {
  //   let obj = arr[s] || {};
  //   obj.prop = obj.prop || 'prop';
  //   obj.type = (obj.type || 'string').toLowerCase();
  //   if(options[obj.prop]) {
  //     options[obj.prop] = obj.type;
  //   } else {
  //     schema[obj.prop] = types[obj.type] || String;
  //   }
  // }
  sessionModels[options.collection] = mongoose.model(options.collection, new mongoose.Schema({name: String}));
  next(sessionModels[options.collection]);
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
  setup(event, context, function(site) {
    site.model.create(JSON.parse(event.body))
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, site.err));     
  });
};

module.exports.get = (event, context, callback) => {
  setup(event, context, function(site) {
    site.model.find({})
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, site.err));   
  });
};

module.exports.getOne = (event, context, callback) => {
  setup(event, context, function(site) {
    site.model.findById(event.pathParameters.id)
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, site.err));  
  });
};

module.exports.put = (event, context, callback) => {
  setup(event, context, function(site) {
      site.model.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true })
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
        .catch(err => callback(null, site.err));  
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
