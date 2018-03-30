const jwt = require('jsonwebtoken');
const users = require('./models/users');
const connectToDb = require('./db');
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

module.exports.checkToken1 = (event, context, next) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const token = event.headers['ply-token'];
  const userId = event.headers.userid;
  if(!token || !userId) return next({success: false, message: 'No token or userid provided'});
  connectToDb()
    .then(() => {
    	users.findById(userId, (err, user) => {
    		if(!user) return next({success: false, message: 'nope'});
        jwt.verify(token, user.password, (err, decoded) => {
    			if (err) {
    				next({ success: false, message: 'You are logged out.' });
    			} else {
    				next({success: true});
    			}
    		});
    	});      
    });
};
