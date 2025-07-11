const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, profileImage } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const user = new User({ username, email, password, profileImage });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email, profileImage: user.profileImage },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.status(200).json({
      user: { id: user._id, username: user.username, email: user.email, profileImage: user.profileImage },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Google OAuth callback controller
exports.googleAuthCallback = async (req, res) => {
  // Passport attaches user to req.user after successful authentication
  if (!req.user) {
    return res.status(401).json({ message: 'Google authentication failed' });
  }
  // Issue JWT
  const token = generateToken(req.user);
  // Redirect or respond with token (for SPA, send as query param or JSON)
  // For now, send as JSON
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/?token=${token}`);
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { username, email, password, isPrivate } = req.body;
    if (username) user.username = username;
    if (email) user.email = email;
    if (typeof isPrivate === 'boolean') user.isPrivate = isPrivate;
    if (password) user.password = password;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 