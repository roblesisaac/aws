const mongoose = require('mongoose');

const user = {
  username: String,
  apps: [String]
};

const script = {
  name: String,
  txt: String
};

const schema = {
  prop: String,
  type: String
};

const sheetSchema = new mongoose.Schema({
    "name" : String,
    "link" : String,
    "sort" : Number,
    "load" : String,
    "public" : Boolean,
    "scripts": [script],
    "_schema" : [schema],
    "tmplts" : [script],
    "users": [user],
    "siteId": String
});

// sheetSchema.pre('save', function (next) {
//     var userId = this.userId;
//     if (this.url === '') this.url = this.name;
//     next();
// });

module.exports = mongoose.model('sheet', sheetSchema);
