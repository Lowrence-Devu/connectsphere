const express = require('express');
const router = express.Router();
const videoCallController = require('../controllers/videoCallController');
const auth = require('../middleware/auth');

// Create a new video call
router.post('/', auth, videoCallController.createCall);

// Accept a call
router.post('/:callId/accept', auth, videoCallController.acceptCall);

// Reject a call
router.post('/:callId/reject', auth, videoCallController.rejectCall);

// End a call
router.post('/:callId/end', auth, videoCallController.endCall);

// Get call status
router.get('/:callId/status', auth, videoCallController.getCallStatus);

// Get active calls for user
router.get('/active', auth, videoCallController.getActiveCalls);

module.exports = router; 