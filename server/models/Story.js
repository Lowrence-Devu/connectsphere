const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  media: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
  },
  caption: {
    type: String,
    default: '',
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { 
  timestamps: true,
  // Add TTL index to automatically delete expired stories
  expires: 24 * 60 * 60 // 24 hours in seconds
});

// Index for querying active stories
StorySchema.index({ isActive: 1, expiresAt: 1 });
StorySchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Story', StorySchema); 