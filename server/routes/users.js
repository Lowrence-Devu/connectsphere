const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, isAdmin } = require('../middleware/auth');

// Search users
router.get('/search', auth, userController.searchUsers);

// Get current user profile (must come before /:id routes)
router.get('/me', auth, userController.getCurrentUser);

// Get user posts by ID (must come before /:id route) - TEMPORARILY COMMENTED
// router.get('/:id/posts', userController.getUserPosts);

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