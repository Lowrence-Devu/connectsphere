const Post = require('../models/Post');
const User = require('../models/User');
const notify = require('../utils/notify');

// Create a post
exports.createPost = async (req, res) => {
  try {
    const { text, image } = req.body;
    const post = new Post({
      text,
      image: image || '',
      author: req.user._id,
    });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all posts (news feed)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get posts by user
exports.getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Like or unlike a post (toggle)
exports.toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const userId = req.user._id.toString();
    const liked = post.likes.map(id => id.toString()).includes(userId);
    if (liked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId);
      await post.save();
      return res.json({ message: 'Post unliked' });
    } else {
      // Like
      post.likes.push(req.user._id);
      await post.save();
      // Emit notification if not self-like
      if (post.author.toString() !== userId) {
        await notify({ type: 'like', sender: req.user._id, receiver: post.author, post: post._id, req });
      }
      return res.json({ message: 'Post liked' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const original = await Post.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Original post not found' });
    const { caption } = req.body;
    const shared = new Post({
      text: original.text,
      image: original.image,
      author: original.author,
      sharedBy: req.user._id,
      originalPost: original._id,
      caption: caption || '',
    });
    await shared.save();
    await shared.populate('author sharedBy originalPost');
    res.status(201).json(shared);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 