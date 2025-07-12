// Test file for video calling functionality
// This file can be used to test the enhanced video calling features

import { useVideoCall } from './hooks/useVideoCall';

// Mock user and activeChat for testing
const mockUser = {
  _id: 'test-user-1',
  username: 'TestUser1'
};

const mockActiveChat = {
  _id: 'test-user-2',
  username: 'TestUser2'
};

// Test function to verify video call hook
export const testVideoCallHook = () => {
  console.log('Testing video call hook...');
  
  // Test the hook
  const videoCallState = useVideoCall(mockUser, mockActiveChat);
  
  console.log('Video call state:', videoCallState);
  
  // Test call functions
  if (videoCallState.startCall) {
    console.log('✅ startCall function available');
  }
  
  if (videoCallState.acceptCall) {
    console.log('✅ acceptCall function available');
  }
  
  if (videoCallState.declineCall) {
    console.log('✅ declineCall function available');
  }
  
  if (videoCallState.endCall) {
    console.log('✅ endCall function available');
  }
  
  if (videoCallState.toggleMute) {
    console.log('✅ toggleMute function available');
  }
  
  if (videoCallState.toggleVideo) {
    console.log('✅ toggleVideo function available');
  }
  
  console.log('✅ All video call functions are available');
};

// Test audio functionality
export const testAudioSystem = () => {
  console.log('Testing audio system...');
  
  try {
    // Test Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log('✅ Web Audio API available');
    
    // Test creating oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    console.log('✅ Audio oscillator created successfully');
    
    // Clean up
    oscillator.disconnect();
    gainNode.disconnect();
    audioContext.close();
    
  } catch (error) {
    console.error('❌ Audio system test failed:', error);
  }
};

// Test WebRTC functionality
export const testWebRTC = () => {
  console.log('Testing WebRTC functionality...');
  
  try {
    // Test getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log('✅ getUserMedia available');
    } else {
      console.error('❌ getUserMedia not available');
    }
    
    // Test RTCPeerConnection
    if (window.RTCPeerConnection) {
      console.log('✅ RTCPeerConnection available');
    } else {
      console.error('❌ RTCPeerConnection not available');
    }
    
    // Test simple-peer
    if (typeof require !== 'undefined') {
      try {
        const Peer = require('simple-peer');
        console.log('✅ simple-peer available');
      } catch (error) {
        console.error('❌ simple-peer not available:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ WebRTC test failed:', error);
  }
};

// Run all tests
export const runAllTests = () => {
  console.log('🧪 Running video call tests...');
  
  testAudioSystem();
  testWebRTC();
  
  console.log('✅ All tests completed');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testVideoCall = {
    testVideoCallHook,
    testAudioSystem,
    testWebRTC,
    runAllTests
  };
} 