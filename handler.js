const connectToDb = require('./db');
const mongoose = require('mongoose');
const checkToken = require('./auth').checkToken;
const models = {
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

module.exports.findSheet = (event, context, next) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const path = { url: event.pathParameters.sitename, sheet: event.pathParameters.sheet };
  connectToDb().then(() => {
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
  return 'test';
};
