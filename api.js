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
  // const siteUrl = event.pathParameters.sitename;
  // const sheetName = event.pathParamenter.sheet;
  // const method = prtcl[sheetName];
  connectToDatabase()
    .then(() => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          event: event
        })
      })
    });
}
