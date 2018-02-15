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
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Welcome to the api of .com !!',
      context: context,
      event: event
    }),
  };
  // const siteUrl = event.pathParameters.sitename;
  // const sheetName = event.pathParamenter.sheet;
  // const method = prtcl[sheetName];
  connectToDatabase()
    .then(() => {
      callback(null, response)
    });
}
