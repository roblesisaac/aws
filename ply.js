const checkToken = require('./auth').checkToken;
const DB = process.env.DB;
const models = {
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
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
  findSheet: function(event, context, next) {
    const path = { url: event.pathParameters.sitename, sheet: event.pathParameters.sheet };
    this.connect(context).then(() => {
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
  },
  sheets: function() {
    return 'test three';
  }
};

for (var key in ply) {
  if(key.indexOf('_') === -1) module.exports[key] = ply[key];
}
