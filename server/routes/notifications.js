const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Get notifications
router.get('/', auth, notificationController.getNotifications);
// Mark as read (all or by id)
router.post('/read', auth, notificationController.markAsRead);

module.exports = router; 