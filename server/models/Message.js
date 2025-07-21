const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for group messages
  },
  text: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema); 