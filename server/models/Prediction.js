const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String },
  input: { type: Object },
  result: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Prediction', PredictionSchema);
