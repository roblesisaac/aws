const ply = require('ply');

module.exports.login = (event, context, callback) => {
  const user = JSON.parse(event.body);
  ply.login(context, user, function(err, tokenObj){
    if(err) {
      ply.error(callback, err);     
    } else {
      ply.res(callback, JSON.stringify(tokenObj));
    }
  });
};
