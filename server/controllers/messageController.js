const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;
    if (!receiver || !text) return res.status(400).json({ message: 'Receiver and text required' });
    const message = await Message.create({
      sender: req.user._id,
      receiver,
      text
    });
    await message.populate('sender', 'username profileImage');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profileImage');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get inbox (list of conversations)
exports.getInbox = async (req, res) => {
  try {
    // Find all users this user has messaged or received messages from
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    // Group by conversation partner
    const conversations = {};
    messages.forEach(msg => {
      const otherUser = msg.sender.equals(req.user._id) ? msg.receiver.toString() : msg.sender.toString();
      if (!conversations[otherUser]) {
        conversations[otherUser] = {
          user: otherUser,
          lastMessage: msg,
          unread: 0
        };
      }
      if (!msg.read && msg.receiver.equals(req.user._id)) {
        conversations[otherUser].unread += 1;
      }
    });

    // Populate user info
    const userIds = Object.keys(conversations);
    const users = await User.find({ _id: { $in: userIds } }).select('username profileImage');
    users.forEach(u => {
      if (conversations[u._id]) conversations[u._id].user = u;
    });

    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 