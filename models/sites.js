const mongoose = require('mongoose');

var mongoose = new mongoose.Schema({
    name: String,
    userId: String,
    url: { type: String, unique: true }
});

module.exports = mongoose.model('site', siteSchema);
