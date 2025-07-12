const Reel = require('../models/Reel');
const User = require('../models/User');
const notify = require('../utils/notify');

// Create a new reel
const createReel = async (req, res) => {
  try {
    const { 
      video, 
      thumbnail, 
      caption, 
      duration, 
      tags, 
      music, 
      effects,
      isPublic = true 
    } = req.body;
    const userId = req.user._id;

    const reel = new Reel({
      author: userId,
      video,
      thumbnail,
      caption,
      duration,
      tags: tags || [],
      music: music || {},
      effects: effects || { filters: [], transitions: [] },
      isPublic
    });

    await reel.save();
    await reel.populate('author', 'username profileImage');

    res.status(201).json(reel);
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({ message: 'Failed to create reel' });
  }
};

// Get all public reels for the feed
const getReels = async (req, res) => {
  try {
    const { page = 1, limit = 10, tag } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };
    if (tag) {
      query.tags = { $in: [tag] };
    }

    const reels = await Reel.find(query)
      .populate('author', 'username profileImage')
      .populate('likes.user', 'username profileImage')
      .populate('views.user', 'username profileImage')
      .populate('comments.user', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reel.countDocuments(query);

    res.json({
      reels,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({ message: 'Failed to fetch reels' });
  }
};

// Get reels for a specific user
const getUserReels = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reels = await Reel.find({ 
      author: userId,
      isPublic: true 
    })
    .populate('author', 'username profileImage')
    .populate('likes.user', 'username profileImage')
    .populate('views.user', 'username profileImage')
    .populate('comments.user', 'username profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Reel.countDocuments({ 
      author: userId, 
      isPublic: true 
    });

    res.json({
      reels,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get user reels error:', error);
    res.status(500).json({ message: 'Failed to fetch user reels' });
  }
};

// Get a specific reel
const getReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId)
      .populate('author', 'username profileImage')
      .populate('likes.user', 'username profileImage')
      .populate('views.user', 'username profileImage')
      .populate('comments.user', 'username profileImage');

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Check if user already viewed this reel
    const alreadyViewed = reel.views.some(view => 
      view.user._id.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      reel.views.push({ user: userId });
      await reel.save();
    }

    res.json(reel);
  } catch (error) {
    console.error('Get reel error:', error);
    res.status(500).json({ message: 'Failed to fetch reel' });
  }
};

// Like/unlike a reel
const toggleLike = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const existingLike = reel.likes.find(like => 
      like.user.toString() === userId.toString()
    );

    if (existingLike) {
      // Unlike
      reel.likes = reel.likes.filter(like => 
        like.user.toString() !== userId.toString()
      );
    } else {
      // Like
      reel.likes.push({ user: userId });
    }

    await reel.save();
    await reel.populate('likes.user', 'username profileImage');

    res.json({ 
      liked: !existingLike, 
      likeCount: reel.likes.length,
      likes: reel.likes 
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
};

// Add comment to reel
const addComment = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.comments.push({
      user: userId,
      text
    });

    await reel.save();
    await reel.populate('comments.user', 'username profileImage');

    // Notify reel author (if not the same user)
    if (reel.author.toString() !== userId.toString()) {
      await notify(userId, reel.author, 'comment', `commented on your reel`, reel._id);
    }

    res.json(reel.comments[reel.comments.length - 1]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

// Delete comment from reel
const deleteComment = async (req, res) => {
  try {
    const { reelId, commentId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const comment = reel.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or the reel
    if (comment.user.toString() !== userId.toString() && 
        reel.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await reel.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

// Share a reel
const shareReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.shares += 1;
    await reel.save();

    res.json({ shares: reel.shares });
  } catch (error) {
    console.error('Share reel error:', error);
    res.status(500).json({ message: 'Failed to share reel' });
  }
};

// Delete a reel
const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Check if user owns the reel
    if (reel.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    await Reel.findByIdAndDelete(reelId);
    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ message: 'Failed to delete reel' });
  }
};

// Get trending reels
const getTrendingReels = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const reels = await Reel.aggregate([
      { $match: { isPublic: true } },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 2] },
              { $multiply: [{ $size: '$views' }, 1] },
              { $multiply: [{ $size: '$comments' }, 3] },
              { $multiply: ['$shares', 5] }
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Populate the results
    const populatedReels = await Reel.populate(reels, [
      { path: 'author', select: 'username profileImage' },
      { path: 'likes.user', select: 'username profileImage' },
      { path: 'views.user', select: 'username profileImage' },
      { path: 'comments.user', select: 'username profileImage' }
    ]);

    res.json(populatedReels);
  } catch (error) {
    console.error('Get trending reels error:', error);
    res.status(500).json({ message: 'Failed to fetch trending reels' });
  }
};

module.exports = {
  createReel,
  getReels,
  getUserReels,
  getReel,
  toggleLike,
  addComment,
  deleteComment,
  shareReel,
  deleteReel,
  getTrendingReels
}; 