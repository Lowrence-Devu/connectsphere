const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');

// Helper to populate group info
async function populateGroup(group) {
  await group.populate([
    { path: 'members', select: 'username email profileImage' },
    { path: 'admins', select: 'username email profileImage' }
  ]);
  return group;
}

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const group = new Group({
      name,
      description,
      members: [req.user._id, ...(members || [])],
      admins: [req.user._id],
    });
    await group.save();
    const populated = await populateGroup(group);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all groups for the current user
exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate('members', 'username profileImage');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add member (admin only)
exports.addMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user._id)) return res.status(403).json({ message: 'Only admins can add members' });

    let userId = req.body.userId;
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findOne({
        $or: [{ username: userId }, { email: userId }]
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      userId = user._id;
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    const populated = await populateGroup(group);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove member (admin only)
exports.removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user._id)) return res.status(403).json({ message: 'Only admins can remove members' });
    const { userId } = req.body;
    group.members = group.members.filter(id => id.toString() !== userId);
    group.admins = group.admins.filter(id => id.toString() !== userId);
    await group.save();
    const populated = await populateGroup(group);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get group info by ID
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const populated = await populateGroup(group);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send a message to a group
exports.sendGroupMessage = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(req.user._id)) return res.status(403).json({ message: 'Not a group member' });
    const { text } = req.body;
    const message = await Message.create({
      sender: req.user._id,
      text,
      group: group._id,
    });
    group.messages.push(message._id);
    await group.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all messages for a group
exports.getGroupMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate({
      path: 'messages',
      populate: { path: 'sender', select: 'username profileImage' },
    });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(req.user._id)) return res.status(403).json({ message: 'Not a group member' });
    res.json(group.messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit group name (admin only)
exports.editGroupName = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user._id)) return res.status(403).json({ message: 'Only admins can edit group name' });
    group.name = req.body.name;
    await group.save();
    const populated = await populateGroup(group);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Leave group (any member)
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.members = group.members.filter(id => id.toString() !== req.user._id.toString());
    group.admins = group.admins.filter(id => id.toString() !== req.user._id.toString());
    await group.save();
    const populated = await populateGroup(group);
    res.json({ message: 'Left group', group: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Multer setup for group avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/../uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'group-' + req.params.groupId + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Group avatar upload controller
exports.uploadGroupAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      const group = await Group.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      if (!group.admins.includes(req.user._id)) return res.status(403).json({ message: 'Only admins can change group avatar' });
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      // Save the file path or URL
      group.profileImage = `/uploads/${req.file.filename}`;
      await group.save();
      const populated = await populateGroup(group);
      res.json(populated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
]; 