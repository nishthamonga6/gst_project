const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filename: { type: String },
  originalName: { type: String },
  mimeType: { type: String },
  text: { type: String },
  extract: { type: Object },
  analysis: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
