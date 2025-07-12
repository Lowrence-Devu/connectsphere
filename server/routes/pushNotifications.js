const express = require('express');
const router = express.Router();
const pushNotificationController = require('../controllers/pushNotificationController');
const auth = require('../middleware/auth');

// Update FCM token
router.post('/fcm-token', auth, pushNotificationController.updateFCMToken);

// Update notification settings
router.put('/settings', auth, pushNotificationController.updateNotificationSettings);

// Get notification settings
router.get('/settings', auth, pushNotificationController.getNotificationSettings);

// Send test notification
router.post('/test', auth, pushNotificationController.sendTestNotification);

// Subscribe to topic
router.post('/subscribe', auth, pushNotificationController.subscribeToTopic);

// Unsubscribe from topic
router.post('/unsubscribe', auth, pushNotificationController.unsubscribeFromTopic);

// Admin routes (for sending notifications)
router.post('/send-to-user', auth, pushNotificationController.sendNotificationToUser);
router.post('/send-to-multiple', auth, pushNotificationController.sendNotificationToMultipleUsers);

module.exports = router; 