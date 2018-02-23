const jwt = require('jsonwebtoken');
const users = require('./models/users');
const connectToDb = require('./db');

const loginUser = (user, next) => {
  connectToDb()
    .then(() => {
    	users.findOne({username: user.username}, function(err, fUser) {
    		if (err) throw err;
    		if (!fUser) {
    			next({ success: false, message: 'User not found.' });
    		} else if (fUser) {
    			fUser.comparePassword(user.password, function(err, isMatch){
    				if(isMatch && isMatch === true) {
    					// if user is found and password is right create a token
    					next(jwt.sign({ _id: fUser._id, username: fUser.username, name: fUser.name,	password: fUser.password	}, fUser.password, {	expiresIn: '15h' }));
    				} else {
    					next({ success: false, message: 'Authentication failed. Wrong password.' });
    				}
    			});
    		}
    	});
    });
};

module.exports.login = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  loginUser(JSON.parse(event.body), (res) => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(res)
    });
  });
};

const checkToken = (token, userId, next) => {
  if(!token || !userId) return next({success: false});
  
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

module.exports.auth = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  // const token = event.headers['ply-token'];
  // const userid = event.headers.userid;
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      event: event
    })
  });
  // if(token && userid) {
  //   checkToken(token, userid, (res) => {
  //     callback(null, {
  //       statusCode: 200,
  //       body: JSON.stringify(res)
  //     });
  //   });
  // } else {
  //   return callback('No auth provided');
  // }
};
