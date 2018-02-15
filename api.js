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
