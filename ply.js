const checkToken = require('./auth').checkToken;
const DB = process.env.DB;
const jwt = require('jsonwebtoken');
const models = {
  sites: require('./models/sites'),
  sheets: require('./models/sheets'),
  users: require('./models/users')
};
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
let isConnected;

const ply = {
  connect: function(context) {
    if(context) context.callbackWaitsForEmptyEventLoop = false;
    if (isConnected) {
      return Promise.resolve();
    }
    return mongoose.connect(DB)
      .then(db => { 
        isConnected = db.connections[0].readyState;
      });    
  },
  checkToken: function(context, token, userid, next) {
    if(!token || !userid) return next('No token or userid provided');
    this.connect(context).then(function(){
    	models.users.findById(userid, (err, user) => {
    		if(!user) return next('no user found with this id: '+userid);
        jwt.verify(token, user.password, (err2, decoded) => {
    			if (err2) {
    				next('You are logged out with this error: '+ err2);
    			} else {
    				next(null, decoded);
    			}
    		});
    	}); 
    });
  },
  error: function(callback, err) {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        error: err
      })
    }); 
  },
  findSheet: function(context, siteUrl, sheetName, next) {
    this.connect(context).then(() => {
      // get site
      models.sites.findOne({ url: siteUrl }).then(function(site){
        if(!site) return next(siteUrl + ' plysheet not found.');
        models.sheets.findOne({ siteId: site._id, name: sheetName }).then(function(sheet){
          if(!sheet) return next(siteUrl + ' plysheet found but no ' + sheetName + ' sheet found.');
          next(null, sheet);
        });
      });
    });      
  },
  login: function(context, user, next) {
    this.connect(context).then(function(){
    	models.users.findOne({username: user.username}, function(err, foundUser) {
    		if (err) {
    		  next(err);
    		  return;
    		}
    		if (!foundUser) {
    			next(user.username + ' not found');
    		} else if (foundUser) {
    			foundUser.comparePassword(user.password, function(err2, isMatch){
    				if(isMatch && isMatch === true) {
    					next(null, {
    					  token: jwt.sign({ _id: foundUser._id, username: foundUser.username, name: foundUser.name,	password: foundUser.password	}, foundUser.password, {	expiresIn: '15h' }),
    					  userid: foundUser._id
    					});
    				} else {
    					next('Authentication failed. Wrong password.');
    				}
    			});
    		}
    	});
    });
  },
  res: function(callback, body) {
    callback(null, {
      statusCode: 200,
      body: body
    }); 
  },
  sheets: function() {
    return 'test four';
  }
};

for (var key in ply) {
  if(key.indexOf('_') === -1) module.exports[key] = ply[key];
}
