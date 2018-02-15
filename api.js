const connectToDatabase = require('./db');
const user = require('./models/users');
const site = require('./models/sites');
const sheet = require('./models/sheets');
const prtcl = {
  user: 'user protocol',
  site: 'site  protocol',
  sheet: 'sheet  protocol'
};

module.exports.rest = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const siteName = event.pathParameters.sitename;
  const sheetName = event.pathParameters.sheet;
  const method = prtcl[sheetName];
  connectToDatabase()
    .then(() => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          method: method,
          event: event
        })
      });
    });
}
