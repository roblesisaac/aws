const connectToDb = require('./db');
const mongoose = require('mongoose');
const checkToken = require('./auth').checkToken;
const models = {
  users: require('./models/users'),
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

function areThereAnyYet(name, data, next) {
  models[name].find().then(function(res) {
    if(res.length === 0) {
      createFirst(name, data, function(firstItem) {
        next(firstItem);
      });
    } else {
      next(res[0]);
    }
  });      
}
function createFirst(name, data, next) {
  models[name].create(data).then(function(res){
    next(res);
  });
}

module.exports.init = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  connectToDb().then(() => {
    const firstUser = { name: 'Eiken', password: 'pass' };
    areThereAnyYet('users', firstUser, function(user) {
      const firstSite = { name: 'plysheet', userId: user._id, url: 'plysheet' };
      areThereAnyYet('sites', firstSite, function(site) {
        if(sites.length === 0) {
          createFirst('sites', function(site) {
            callback(null, {
              statusCode: 200,
              body: JSON.stringify({
                user:user,
                site: site
              })
            });            
          });
        }
      });  
    });
  });
};
