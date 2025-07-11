const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Send a message
router.post('/', auth, messageController.sendMessage);
// Get conversation with a user
router.get('/conversation/:userId', auth, messageController.getConversation);
// Get inbox
router.get('/inbox', auth, messageController.getInbox);

module.exports = router; 