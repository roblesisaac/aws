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
    model: models[event.pathParameters.sheet] || mongoose.model(url, new mongoose.Schema({name: String},{strict: false})),
    err: {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Could not create the note.'      
    }
  };
  connectToDb().then(() => fn(site));  
};

module.exports.test = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    body: {
      context: context,
      event: event
    }
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
