const restful = require('node-restful');
const mongoose = require('mongoose');
const NoteSchema = new mongoose.Schema({  
  title: String,
  description: String
});
module.exports = restful.model('Note', NoteSchema);
