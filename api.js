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

const createModel = (event, context, next) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const site = { url: event.pathParameters.sitename, sheet: event.pathParameters.sheet };
  connectToDb().then(() => {
    //get site
    next(null, {site: 'her it is'});
    // models.sites.findOne({ url: site.url })
    //   .then(site => {
    //     //get sheet
    //     models.sheets.findOne({ siteId: site._id, name: site.sheet }, (sheet) => {
    //       if(sheet.public) {
    //         fn(null, models[event.pathParameters.sheet]);
    //       } else {
    //         checkToken(event, context, (res) => {
    //           if(res.success === true) {
    //             next(null, models[event.pathParameters.sheet]);
    //           } else {
    //             next(res.message);
    //           }
    //         });
    //       }
    //     });
    //   });
  });  
};

module.exports.test = (event, context, callback) => {
  createModel(event, context, function(error, model) {
    if(error) {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({ message: error })
      });
    } else {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(model)
      });
    }
    // model.find({})
    //   .then(data => callback(null, {
    //     statusCode: 200,
    //     body: JSON.stringify(data)
    //   }))
    //   .catch(err => callback(null, err));
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
