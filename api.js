const connectToDatabase = require('./db');
const user = require('./models/users');
const site = require('./models/sites');
const sheet = require('./models/sheets');
const prtcl = {
  users: 'user protocol',
  sites: 'site  protocol',
  sheets: 'sheet  protocol'
};

module.exports.rest = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const siteName = event.pathParameters.sitename;
  const sheetName = event.pathParameters.sheet;
  const schema = prtcl[sheetName];
  const method = event.httpMethod;
  connectToDatabase()
    .then(() => {
      if(method) {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({
            message: schema
          })
        });
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
