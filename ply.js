const mongoose = require('mongoose');
const checkToken = require('./auth').checkToken;
const DB = process.env.DB;
mongoose.Promise = global.Promise;
let isConnected;
const models = {
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

module.exports.connect = (context) => {
  if(context) context.callbackWaitsForEmptyEventLoop = false;
  if (isConnected) {
    return Promise.resolve();
  }
  return mongoose.connect(DB)
    .then(db => { 
      isConnected = db.connections[0].readyState;
    });
};

// module.exports.find = (modelName, query, next) => {
//   module.exports.connect(context, function() {
//     models[modelName].findOne(query).then(function(data){
//       next(data);
//     });
//   });
// };

// module.exports.findSheet = () => {
//   ply.find('sites', { url: path.url }, function() {
    
//   });
// };

module.exports.findSheet = (event, context, next) => {
  const path = { url: event.pathParameters.sitename, sheet: event.pathParameters.sheet };
  module.exports.connect(context).then(() => {
    // get site
    models.sites.findOne({ url: path.url })
      .then(site => {
        if(!site) return next(path.url + ' plysheet not found.');
        //get sheet
        models.sheets.findOne({ siteId: site._id, name: path.sheet })
          .then(sheet => {
            if(!sheet) return next(path.url + ' plysheet found but no ' + path.sheet + ' sheet found.');
            next(null, sheet);
          });
      });
  });   
};

module.exports.sheets = function() {
  return 'test two';
};
