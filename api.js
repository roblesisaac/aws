const connectToDatabase = require('./db');
const user = require('./models/users');
const prtcl = {
  user: 'user protocol',
  site: 'site  protocol',
  sheet: 'sheet  protocol'
};

module.exports.rest = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Welcome to the api of .com !!',
      context: context,
      event: event
    }),
  };

  callback(null, response);
}
