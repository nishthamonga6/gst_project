const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Data', DataSchema);
