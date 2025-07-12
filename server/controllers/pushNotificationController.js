const User = require('../models/User');
const pushNotificationService = require('../services/pushNotificationService');

// Update FCM token for user
const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { fcmToken });
    
    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ message: 'Failed to update FCM token' });
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const { notificationSettings } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { notificationSettings });
    
    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
};

// Get notification settings
const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('notificationSettings');
    
    res.json(user.notificationSettings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ message: 'Failed to get notification settings' });
  }
};

// Send test notification
const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user.fcmToken) {
      return res.status(400).json({ message: 'No FCM token found for user' });
    }

    const notification = {
      title: 'Test Notification',
      body: 'This is a test notification from ConnectSphere!',
      data: {
        type: 'test',
        timestamp: Date.now().toString()
      }
    };

    await pushNotificationService.sendNotification(user.fcmToken, notification);
    
    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
};

// Send notification to user (admin function)
const sendNotificationToUser = async (req, res) => {
  try {
    const { userId, notification } = req.body;
    const user = await User.findById(userId);
    
    if (!user.fcmToken) {
      return res.status(400).json({ message: 'User has no FCM token' });
    }

    await pushNotificationService.sendNotification(user.fcmToken, notification);
    
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Send notification to user error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
};

// Send notification to multiple users (admin function)
const sendNotificationToMultipleUsers = async (req, res) => {
  try {
    const { userIds, notification } = req.body;
    const users = await User.find({ _id: { $in: userIds } });
    
    const fcmTokens = users
      .filter(user => user.fcmToken)
      .map(user => user.fcmToken);

    if (fcmTokens.length === 0) {
      return res.status(400).json({ message: 'No valid FCM tokens found' });
    }

    await pushNotificationService.sendNotificationToMultipleUsers(fcmTokens, notification);
    
    res.json({ 
      message: 'Notifications sent successfully',
      sentTo: fcmTokens.length
    });
  } catch (error) {
    console.error('Send notification to multiple users error:', error);
    res.status(500).json({ message: 'Failed to send notifications' });
  }
};

// Subscribe user to topic
const subscribeToTopic = async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user.fcmToken) {
      return res.status(400).json({ message: 'No FCM token found for user' });
    }

    await pushNotificationService.subscribeToTopic(user.fcmToken, topic);
    
    res.json({ message: 'Subscribed to topic successfully' });
  } catch (error) {
    console.error('Subscribe to topic error:', error);
    res.status(500).json({ message: 'Failed to subscribe to topic' });
  }
};

// Unsubscribe user from topic
const unsubscribeFromTopic = async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user.fcmToken) {
      return res.status(400).json({ message: 'No FCM token found for user' });
    }

    await pushNotificationService.unsubscribeFromTopic(user.fcmToken, topic);
    
    res.json({ message: 'Unsubscribed from topic successfully' });
  } catch (error) {
    console.error('Unsubscribe from topic error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe from topic' });
  }
};

module.exports = {
  updateFCMToken,
  updateNotificationSettings,
  getNotificationSettings,
  sendTestNotification,
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  subscribeToTopic,
  unsubscribeFromTopic
}; 