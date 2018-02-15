const connectToDatabase = require('./db');
const user = require('./models/users');
const site = require('./models/sites');
const sheet = require('./models/sheets');
const prtcl = {
  users: 'user protocol',
  sites: 'site  protocol',
  sheets: 'sheet  protocol'
};

const post = function(model, event, callback) {
  model.create(JSON.parse(event.body))
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
  const model = prtcl[sheetName];
  const method = event.httpMethod;
  connectToDatabase()
    .then(() => {
      if(model) {
        post(model, event, callback);
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
