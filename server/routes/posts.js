const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');

// Create a post
router.post('/', auth, postController.createPost);
// Get all posts (news feed)
router.get('/', postController.getAllPosts);
// Get posts by user
router.get('/user/:userId', postController.getPostsByUser);
// Like or unlike a post (toggle)
router.post('/:id/like', auth, postController.toggleLikePost);
// Share a post
router.post('/:id/share', auth, postController.sharePost);

module.exports = router; 