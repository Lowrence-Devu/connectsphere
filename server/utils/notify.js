const Notification = require('../models/Notification');
const User = require('../models/User');
const pushNotificationService = require('../services/pushNotificationService');

async function notify({ type, sender, receiver, post = null, comment = null, req }) {
  if (String(sender) === String(receiver)) return; // Don't notify self
  
  try {
    // Get sender and recipient info
    const [senderUser, recipientUser] = await Promise.all([
      User.findById(sender).select('username profileImage'),
      User.findById(receiver).select('username fcmToken notificationSettings')
    ]);

    if (!senderUser || !recipientUser) {
      console.error('Sender or recipient not found');
      return;
    }

    // Check if recipient has push notifications enabled
    if (!recipientUser.notificationSettings?.pushEnabled) {
      console.log('Push notifications disabled for user:', recipientUser._id);
      return;
    }

    // Check specific notification type settings
    const notificationType = type.toLowerCase();
    if (!recipientUser.notificationSettings?.[notificationType]) {
      console.log(`${notificationType} notifications disabled for user:`, recipientUser._id);
      return;
    }

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

    // Send push notification if FCM token exists and Firebase is configured
    if (recipientUser.fcmToken) {
      try {
        const pushNotification = {
          title: getNotificationTitle(type, senderUser.username),
          body: getNotificationBody(type, senderUser.username),
          data: {
            type,
            senderId: sender.toString(),
            senderName: senderUser.username,
            postId: post?.toString() || '',
            commentId: comment?.toString() || '',
            timestamp: Date.now().toString()
          }
        };

        const result = await pushNotificationService.sendNotification(recipientUser.fcmToken, pushNotification);
        
        if (result.success === false) {
          console.log('Push notification skipped:', result.message);
        } else {
          console.log('Push notification sent to:', recipientUser._id);
        }
      } catch (pushError) {
        console.error('Push notification error:', pushError);
        // Don't fail the entire notification if push fails
      }
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// Helper function to get notification titles
const getNotificationTitle = (type, senderName) => {
  switch (type) {
    case 'like':
      return `${senderName} liked your post`;
    case 'comment':
      return `${senderName} commented on your post`;
    case 'follow':
      return `${senderName} started following you`;
    case 'message':
      return `New message from ${senderName}`;
    case 'video_call':
      return `Incoming call from ${senderName}`;
    case 'story':
      return `${senderName} added a new story`;
    case 'reel':
      return `${senderName} posted a new reel`;
    default:
      return `New notification from ${senderName}`;
  }
};

// Helper function to get notification bodies
const getNotificationBody = (type, senderName) => {
  switch (type) {
    case 'like':
      return `${senderName} liked your post`;
    case 'comment':
      return `${senderName} commented on your post`;
    case 'follow':
      return `${senderName} started following you`;
    case 'message':
      return `You have a new message`;
    case 'video_call':
      return `Incoming video call`;
    case 'story':
      return `${senderName} added a new story`;
    case 'reel':
      return `${senderName} posted a new reel`;
    default:
      return `You have a new notification`;
  }
};

module.exports = notify; 