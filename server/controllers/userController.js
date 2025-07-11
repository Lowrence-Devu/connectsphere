const User = require('../models/User');
const notify = require('../utils/notify');

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.password) delete updates.password; // Don't allow password update here
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);
    if (!userToFollow || !currentUser) return res.status(404).json({ message: 'User not found' });
    if (userToFollow.followers.includes(currentUser._id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }
    userToFollow.followers.push(currentUser._id);
    currentUser.following.push(userToFollow._id);
    await userToFollow.save();
    await currentUser.save();
    // Emit notification
    await notify({ type: 'follow', sender: currentUser._id, receiver: userToFollow._id, req });
    res.json({ message: 'User followed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);
    if (!userToUnfollow || !currentUser) return res.status(404).json({ message: 'User not found' });
    userToUnfollow.followers = userToUnfollow.followers.filter(f => f.toString() !== currentUser._id.toString());
    currentUser.following = currentUser.following.filter(f => f.toString() !== userToUnfollow._id.toString());
    await userToUnfollow.save();
    await currentUser.save();
    res.json({ message: 'User unfollowed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update current user profile
exports.updateCurrentUser = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.password) delete updates.password; // Don't allow password update here
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 

// Search users by username
exports.searchUsers = async (req, res) => {
  try {
    const { q, sortBy = 'username', minFollowers, maxFollowers, hasPosts } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length < 2) {
      return res.json({ users: [], total: 0, page, limit });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    let query = { 
      username: searchRegex,
      _id: { $ne: req.user?._id } // Exclude current user
    };

    // Add follower count filters
    if (minFollowers || maxFollowers) {
      query.followers = {};
      if (minFollowers) query.followers.$gte = parseInt(minFollowers);
      if (maxFollowers) query.followers.$lte = parseInt(maxFollowers);
    }

    // Add hasPosts filter
    if (hasPosts === 'true') {
      // This would require a more complex query to check if user has posts
      // For now, we'll implement this later
    }

    // Determine sort order
    let sort = {};
    switch (sortBy) {
      case 'followers':
        sort = { 'followers.length': -1, username: 1 };
        break;
      case 'recent':
        sort = { createdAt: -1, username: 1 };
        break;
      default:
        sort = { username: 1 };
    }

    const users = await User.find(query)
    .select('username profileImage followers following createdAt')
    .limit(limit)
    .skip(skip)
    .sort(sort);

    const total = await User.countDocuments(query);

    res.json({ 
      users, 
      total, 
      page, 
      limit,
      hasMore: skip + users.length < total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 