const jwt = require('jsonwebtoken');
const users = require('./models/users');
const connectToDb = require('./db');

const loginUser = (user, next) => {
  connectToDb()
    .then(() => {
    	users.findOne({username: user.username}, function(err, User) {
    		if (err) throw err;
    		if (!User) {
    			next({ success: false, message: 'User not found.' });
    		} else if (User) {
    			User.comparePassword(password, function(err, isMatch){
    				if(isMatch && isMatch === true) {
    					// if user is found and password is right create a token
    					next(jwt.sign({ _id: User._id, username: User.username, name: User.name,	password: User.password	}, User.password, {	expiresIn: '15h' }));
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

module.exports.test = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const token = event.headers['ply-token'];
  const userid = event.headers.userid;
  if(token && userid) {
    checkToken(token, userid, (res) => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(res)
      });
    });
  } else {
    return callback('No auth provided');
  }
};

// Reusable Authorizer function, set on `authorizer` field in serverless.yml
module.exports.auth = (event, context, callback) => {
  console.log('event', event)
  if (!event.authorizationToken) {
    return callback('Unauthorized')
  }

  const tokenParts = event.authorizationToken.split(' ')
  const tokenValue = tokenParts[1]

  if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
    // no auth token!
    return callback('Unauthorized')
  }
  const options = {
    audience: AUTH0_CLIENT_ID,
  }
  // decode base64 secret. ref: http://bit.ly/2hA6CrO
  const secret = new Buffer.from(AUTH0_CLIENT_SECRET, 'base64')
  try {
    jwt.verify(tokenValue, secret, options, (verifyError, decoded) => {
      if (verifyError) {
        console.log('verifyError', verifyError)
        // 401 Unauthorized
        console.log(`Token invalid. ${verifyError}`)
        return callback('Unauthorized')
      }
      // is custom authorizer function
      console.log('valid from customAuthorizer', decoded)
      return callback(null, generatePolicy(decoded.sub, 'Allow', event.methodArn))
    })
   } catch (err) {
    console.log('catch error. Invalid token', err)
    return callback('Unauthorized')
  }
}
