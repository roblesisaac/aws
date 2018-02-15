const mongoose = require('mongoose');
const DB = process.env.DB
mongoose.Promise = global.Promise;
let isConnected;

module.exports = connectToDatabase = () => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return Promise.resolve();
  }

  console.log('=> using new database connection');
  return mongoose.connect(DB)
    .then(db => { 
      isConnected = db.connections[0].readyState;
    });
};
