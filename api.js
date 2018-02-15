const connectToDatabase = require('./db');
const models = {
  users: require('./models/users'),
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

const res = function(model, event, callback) {
  const methods = { POST: "create", GET: "find", PUT: "findByIdAndUpdate", DELETE: "findByIdAndRemove" };
  const http = event.httpMethod;
  let req = {};
  if(http === "POST") {
    req = JSON.parse(event.body);
  } else if (http === 'GET') {
    req = event.queryStringParameters;
  }
  model[methods[http]](req)
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

module.exports.rest = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const siteName = event.pathParameters.sitename;
  const sheetName = event.pathParameters.sheet;
  const model = models[sheetName];
  connectToDatabase()
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
