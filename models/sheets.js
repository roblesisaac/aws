const mongoose = require('mongoose');

const user = {
  username: String,
  apps: [String]
};

const schm = {
  propName: String,
  propType: String
};

const sheetSchema = new mongoose.Schema({
    "name" : String,
    "link" : String,
    "sort" : Number,
    "_init" : String,
    "public" : Boolean,
    "js": String,
    "_schema" : [schm],
    "tmplt" : String,
    "users": [user],
    "siteId": String
});

module.exports = mongoose.model('sheet', sheetSchema);
