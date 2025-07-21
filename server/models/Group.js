const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema); 