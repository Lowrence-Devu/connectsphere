const mongoose = require('mongoose');

const ReelSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  video: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  caption: {
    type: String,
    default: '',
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    likedAt: {
      type: Date,
      default: Date.now,
    },
  }],
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
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  shares: {
    type: Number,
    default: 0,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  music: {
    title: String,
    artist: String,
    url: String,
  },
  effects: {
    filters: [String],
    transitions: [String],
  },
}, { 
  timestamps: true 
});

// Indexes for better query performance
ReelSchema.index({ author: 1, createdAt: -1 });
ReelSchema.index({ isPublic: 1, createdAt: -1 });
ReelSchema.index({ tags: 1 });
ReelSchema.index({ 'likes.user': 1 });
ReelSchema.index({ 'views.user': 1 });

// Virtual for like count
ReelSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for view count
ReelSchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Virtual for comment count
ReelSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtuals are included in JSON
ReelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Reel', ReelSchema); 