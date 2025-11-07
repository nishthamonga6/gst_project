const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  meta: { type: Object },
  ip: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);
