const Notification = require('../models/Notification');

async function notify({ type, sender, receiver, post = null, comment = null, req }) {
  if (String(sender) === String(receiver)) return; // Don't notify self
  // Save notification
  const notification = await Notification.create({
    type,
    sender,
    receiver,
    post,
    comment
  });

  // Emit real-time notification if user is online
  const io = req.app.get('io');
  if (io) {
    io.to(String(receiver)).emit('notification', {
      _id: notification._id,
      type,
      sender,
      post,
      comment,
      createdAt: notification.createdAt,
      read: false
    });
  }
}

module.exports = notify; 