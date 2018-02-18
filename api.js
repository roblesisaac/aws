const connectToDb = require('./db');
const mongoose = require('mongoose');
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
    model: models[event.pathParameters.sheet],
    err: {
      statusCode: 500,
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
  setup(event, context, callback, function(site) {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({message: 'test'})
      });   
  });
};

module.exports.get = (event, context, callback) => {
  setup(event, context, callback, function(site) {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({message: 'test'})
      });   
  });
};

module.exports.put = (event, context, callback) => {
  setup(event, context, callback, function(site) {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({message: 'test'})
      });   
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
