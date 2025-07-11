const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Add a comment to a post
router.post('/posts/:postId/comments', auth, commentController.addComment);
// Get comments for a post
router.get('/posts/:postId/comments', commentController.getComments);
// Delete a comment (author only)
router.delete('/comments/:commentId', auth, commentController.deleteComment);

module.exports = router; 