const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user','assistant','system'], default: 'user' },
  content: { type: String },
  meta: { type: Object }
}, { timestamps: true });

const ChatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String },
  messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);
