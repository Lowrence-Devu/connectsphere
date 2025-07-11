const Notification = require('../models/Notification');

// Get notifications for the logged-in user (paginated)
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ receiver: req.user._id })
      .populate('sender', 'username profileImage')
      .populate('post', 'text')
      .populate('comment', 'text')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ receiver: req.user._id });
    const unreadCount = await Notification.countDocuments({ receiver: req.user._id, read: false });

    res.json({ notifications, total, unreadCount, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark notifications as read (all or by id)
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.body;
    if (id) {
      await Notification.updateOne({ _id: id, receiver: req.user._id }, { $set: { read: true } });
    } else {
      await Notification.updateMany({ receiver: req.user._id, read: false }, { $set: { read: true } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 