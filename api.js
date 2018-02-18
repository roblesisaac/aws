const connectToDb = require('./db');
const mongoose = require('mongoose');
const models = {
  users: require('./models/users'),
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

var dbSetup = function(event, context, fn) {
  context.callbackWaitsForEmptyEventLoop = false;
  var res = {
    name: event.pathParameters.sitename,
    sheet: event.pathParameters.sheet,
    model: models[event.pathParameters.sheet] || mongoose.model(url, new mongoose.Schema({name: String},{strict: false})),
    err: {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Could not create the note.'      
    }
  };
  connectToDb().then(() => fn(res));  
};


module.exports.post = (event, context, callback) => {
  dbSetup(event, context, function(res) {
    res.model.create(JSON.parse(event.body))
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, res.err));     
  });
};

module.exports.get = (event, context, callback) => {
  dbSetup(event, context, function(site) {
    site.model.find({})
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, site.err));   
  });
};

module.exports.getOne = (event, context, callback) => {
  dbSetup(event, context, function(res) {
    res.model.findById(event.pathParameters.id)
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, res.err));  
  });
};

module.exports.put = (event, context, callback) => {
  dbSetup(event, context, function(res) {
      res.model.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true })
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
        .catch(err => callback(null, res.err));  
  });
};

module.exports.delete = (event, context, callback) => {
  dbSetup(event, context, function(res) {
      res.model.findByIdAndRemove(event.pathParameters.id)
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify({ message: 'Removed item with id: ' + data._id, item: data })
        }))
        .catch(err => callback(null, res.err));  
  });
};
