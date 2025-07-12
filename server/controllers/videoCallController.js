const User = require('../models/User');
const notify = require('../utils/notify');

// Store active calls
const activeCalls = new Map();

// Create a new video call
const createCall = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const callerId = req.user._id;

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's already an active call
    const existingCall = Array.from(activeCalls.values()).find(call => 
      (call.callerId === callerId.toString() && call.targetId === targetUserId) ||
      (call.callerId === targetUserId && call.targetId === callerId.toString())
    );

    if (existingCall) {
      return res.status(400).json({ message: 'Call already in progress' });
    }

    // Create call session
    const callId = `call_${Date.now()}_${callerId}`;
    const callSession = {
      callId,
      callerId: callerId.toString(),
      targetId: targetUserId,
      status: 'ringing',
      startTime: new Date(),
      participants: [callerId.toString(), targetUserId]
    };

    activeCalls.set(callId, callSession);

    // Notify target user about incoming call
    await notify(callerId, targetUserId, 'video_call', `is calling you`, callId);

    res.json({
      callId,
      status: 'ringing',
      targetUser: {
        _id: targetUser._id,
        username: targetUser.username,
        profileImage: targetUser.profileImage
      }
    });
  } catch (error) {
    console.error('Create call error:', error);
    res.status(500).json({ message: 'Failed to create call' });
  }
};

// Accept a call
const acceptCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const callSession = activeCalls.get(callId);
    if (!callSession) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (callSession.targetId !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this call' });
    }

    if (callSession.status !== 'ringing') {
      return res.status(400).json({ message: 'Call is not in ringing state' });
    }

    // Update call status
    callSession.status = 'active';
    callSession.acceptedAt = new Date();
    activeCalls.set(callId, callSession);

    res.json({
      callId,
      status: 'active',
      participants: callSession.participants
    });
  } catch (error) {
    console.error('Accept call error:', error);
    res.status(500).json({ message: 'Failed to accept call' });
  }
};

// Reject a call
const rejectCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const callSession = activeCalls.get(callId);
    if (!callSession) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (callSession.targetId !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this call' });
    }

    // Update call status
    callSession.status = 'rejected';
    callSession.rejectedAt = new Date();
    activeCalls.set(callId, callSession);

    res.json({ message: 'Call rejected' });
  } catch (error) {
    console.error('Reject call error:', error);
    res.status(500).json({ message: 'Failed to reject call' });
  }
};

// End a call
const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const callSession = activeCalls.get(callId);
    if (!callSession) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (!callSession.participants.includes(userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to end this call' });
    }

    // Update call status
    callSession.status = 'ended';
    callSession.endTime = new Date();
    callSession.endedBy = userId.toString();
    activeCalls.set(callId, callSession);

    res.json({ message: 'Call ended' });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ message: 'Failed to end call' });
  }
};

// Get call status
const getCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;

    const callSession = activeCalls.get(callId);
    if (!callSession) {
      return res.status(404).json({ message: 'Call not found' });
    }

    res.json(callSession);
  } catch (error) {
    console.error('Get call status error:', error);
    res.status(500).json({ message: 'Failed to get call status' });
  }
};

// Get active calls for user
const getActiveCalls = async (req, res) => {
  try {
    const userId = req.user._id;

    const userCalls = Array.from(activeCalls.values()).filter(call => 
      call.participants.includes(userId.toString()) && 
      call.status === 'active'
    );

    res.json(userCalls);
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({ message: 'Failed to get active calls' });
  }
};

// Clean up ended calls (run periodically)
const cleanupEndedCalls = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const [callId, callSession] of activeCalls.entries()) {
    if (callSession.status === 'ended' && callSession.endTime < oneHourAgo) {
      activeCalls.delete(callId);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupEndedCalls, 60 * 60 * 1000);

module.exports = {
  createCall,
  acceptCall,
  rejectCall,
  endCall,
  getCallStatus,
  getActiveCalls,
  activeCalls
}; 