var restful = require('node-restful');
var mongoose = restful.mongoose;

var user = {
  username: String,
  apps: [String]
};

var script = {
  name: String,
  txt: String
}

var sheetSchema = new mongoose.Schema({
    "name" : String,
    "link" : String,
    "load" : String,
    "public" : String,
    "scripts": [script],
    "tmplts" : [script],
    "users": [user],
    "siteId": String
});

// sheetSchema.pre('save', function (next) {
//     var userId = this.userId;
//     if (this.url === '') this.url = this.name;
//     next();
// });

module.exports = restful.model('sheets', sheetSchema);
