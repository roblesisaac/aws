const connectToDb = require('./db');
const mongoose = require('mongoose');
const models = {
  users: require('./models/users'),
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

const res = function(model, event, callback) {
  const methods = { POST: "create", GET: "find", PUT: "findByIdAndUpdate", DELETE: "findByIdAndRemove" };
  const http = event.httpMethod;
  const id = event.pathParameters.id;
  let params = {};
  if(http === "POST") {
    params = JSON.parse(event.body);
  } else if (http === 'GET') {
    params = event.queryStringParameters;
  } else if(id) {
    params = id;
  }
  model[methods[http]](params)
    .then(data => callback(null, {
      statusCode: 200,
      body: JSON.stringify(data)
    }))
    .catch(err => callback(null, {
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Could not create the note.'
    }));
};

const setup = function(event, context, fn) {
  context.callbackWaitsForEmptyEventLoop = false;
  let site = {
    name: event.pathParameters.sitename,
    sheet: event.pathParameters.sheet,
    model: models[event.pathParameters.sheet] || mongoose.model(url, new mongoose.Schema({name: String},{strict: false})),
    err: {
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Could not create the note.'      
    }
  };
  connectToDb()
    .then(function(){
      if(fn) fn(site);
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
  setup(event, context, callback, function(site) {
      site.model.find({})
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
        .catch(err => callback(null, site.err));    
  });
};

module.exports.put = (event, context, callback) => {
  setup(event, context, callback, function(site) {
      site.model.find({})
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
        .catch(err => callback(null, site.err));    
  });
};

module.exports.rest = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const siteName = event.pathParameters.sitename;
  const sheetName = event.pathParameters.sheet;
  const model = models[sheetName];
  connectToDb()
    .then(() => {
      if(model) {
        res(model, event, callback);
      } else {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({
            event: event
          })
        });
      }
    });
};

// module.exports.getOne = (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false;

//   connectToDb()
//     .then(() => {
//       models.note.findById(event.pathParameters.id)
//         .then(note => callback(null, {
//           statusCode: 200,
//           body: JSON.stringify(note)
//         }))
//         .catch(err => callback(null, {
//           statusCode: err.statusCode || 500,
//           headers: { 'Content-Type': 'text/plain' },
//           body: 'Could not fetch the note.'
//         }));
//     });
// };

// module.exports.update = (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false;

//   connectToDb()
//     .then(() => {
//       models.note.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true })
//         .then(note => callback(null, {
//           statusCode: 200,
//           body: JSON.stringify(note)
//         }))
//         .catch(err => callback(null, {
//           statusCode: err.statusCode || 500,
//           headers: { 'Content-Type': 'text/plain' },
//           body: 'Could not fetch the notes.'
//         }));
//     });
// };

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
