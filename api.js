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
  const siteUrl = event.pathParameters.sitename;
  const sheetName = event.pathParameters.sheet;
  let model = prtcl[sheetName];
  connectToDatabase()
    .then(() => {
      callback(null, {
        statusCode: 200,
        model: model,
        event: event,
        context: context
      });
    });
  // connectToDatabase()
  //   .then(() => {
  //     Note.create(JSON.parse(event.body))
  //       .then(note => callback(null, {
  //         statusCode: 200,
  //         body: JSON.stringify(note)
  //       }))
  //       .catch(err => callback(null, {
  //         statusCode: err.statusCode || 500,
  //         headers: { 'Content-Type': 'text/plain' },
  //         body: 'Could not create the note.'
  //       }));
  //   });
};
