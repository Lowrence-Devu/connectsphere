const express = require('express');
const router = express.Router();
const reelController = require('../controllers/reelController');
const auth = require('../middleware/auth');

// Create a new reel
router.post('/', auth, reelController.createReel);

// Get all public reels (paginated)
router.get('/', reelController.getReels);

// Get trending reels
router.get('/trending', reelController.getTrendingReels);

// Get reels for a specific user
router.get('/user/:userId', reelController.getUserReels);

// Get a specific reel
router.get('/:reelId', auth, reelController.getReel);

// Like/unlike a reel
router.post('/:reelId/like', auth, reelController.toggleLike);

// Add comment to reel
router.post('/:reelId/comments', auth, reelController.addComment);

// Delete comment from reel
router.delete('/:reelId/comments/:commentId', auth, reelController.deleteComment);

// Share a reel
router.post('/:reelId/share', auth, reelController.shareReel);

// Delete a reel
router.delete('/:reelId', auth, reelController.deleteReel);

module.exports = router; 