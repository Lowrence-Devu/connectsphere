const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Search users
router.get('/search', auth, userController.searchUsers);

// Get user profile by ID
router.get('/:id', userController.getUserProfile);
// Get current user profile
router.get('/me', auth, userController.getCurrentUser);
// Update current user profile
router.put('/me', auth, userController.updateCurrentUser);
// Follow a user
router.post('/:id/follow', auth, userController.followUser);
// Unfollow a user
router.post('/:id/unfollow', auth, userController.unfollowUser);

module.exports = router; 