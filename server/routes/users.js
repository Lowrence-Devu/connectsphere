const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

// Search users
router.get('/search', auth, userController.searchUsers);

// Get current user profile (must come before /:id routes)
router.get('/me', auth, userController.getCurrentUser);

// Get user posts by ID (must come before /:id route)
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get posts by this user
    const posts = await Post.find({ author: id })
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Get total count for pagination
    const total = await Post.countDocuments({ author: id });

    res.json({
      posts,
      total,
      page,
      limit,
      hasMore: skip + posts.length < total
    });
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get user profile by ID
router.get('/:id', userController.getUserProfile);

// Update current user profile
router.put('/me', auth, userController.updateCurrentUser);

// Follow a user
router.post('/:id/follow', auth, userController.followUser);

// Unfollow a user
router.post('/:id/unfollow', auth, userController.unfollowUser);

// Add admin-only delete user route
router.delete('/:id', auth, isAdmin, userController.deleteUser);

module.exports = router; 