const Comment = require('../models/Comment');
const Post = require('../models/Post');
const notify = require('../utils/notify');

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId;
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const comment = new Comment({
      text,
      author: req.user._id,
      post: postId,
    });
    
    await comment.save();
    
    // Populate author info for response
    await comment.populate('author', 'username profileImage');
    // Emit notification if not self-comment
    if (post.author.toString() !== req.user._id.toString()) {
      await notify({ type: 'comment', sender: req.user._id, receiver: post.author, post: post._id, comment: comment._id, req });
    }
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username profileImage')
      .sort({ createdAt: 1 });
    
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a comment (author only)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await comment.remove();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 