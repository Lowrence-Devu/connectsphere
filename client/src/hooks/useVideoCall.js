import { useState, useEffect, useRef } from 'react';

const useVideoCall = (socket, user) => {
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    if (!socket || !user) return;

    // Listen for incoming calls
    socket.on('call:incoming', (data) => {
      setIncomingCall({
        from: data.from,
        callType: data.callType,
        callId: `call_${Date.now()}_${data.from}`
      });
    });

    // Listen for call acceptance
    socket.on('call:accepted', (data) => {
      setActiveCall(prev => ({
        ...prev,
        status: 'accepted',
        answererId: data.from
      }));
    });

    // Listen for WebRTC offers
    socket.on('offer', async (data) => {
      try {
        if (!peerConnectionRef.current) return;

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit('answer', {
          targetUserId: data.callerId,
          answer: answer,
          answererId: user._id
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Listen for WebRTC answers
    socket.on('answer', async (data) => {
      try {
        if (!peerConnectionRef.current) return;

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    // Listen for ICE candidates
    socket.on('ice-candidate', async (data) => {
      try {
        if (!peerConnectionRef.current) return;

        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Listen for call end
    socket.on('call:ended', (data) => {
      endCall();
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('call:ended');
    };
  }, [socket, user]);

  const initiateCall = async (targetUser) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        // Handle remote stream (you can emit this to your video component)
        console.log('Remote stream received');
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            targetUserId: targetUser._id,
            candidate: event.candidate,
            fromUserId: user._id
          });
        }
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit('offer', {
        targetUserId: targetUser._id,
        offer: offer,
        callerId: user._id
      });

      // Set active call
      setActiveCall({
        callId: `call_${Date.now()}_${user._id}`,
        targetUser,
        status: 'ringing',
        callerId: user._id
      });

      setIsInCall(true);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  const acceptCall = async () => {
    try {
      if (!incomingCall) return;

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Remote stream received');
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            targetUserId: incomingCall.from,
            candidate: event.candidate,
            fromUserId: user._id
          });
        }
      };

      // Accept the call
      socket.emit('call:accept', {
        to: incomingCall.from,
        from: user._id
      });

      setActiveCall({
        callId: incomingCall.callId,
        targetUser: { _id: incomingCall.from },
        status: 'accepted',
        answererId: user._id
      });

      setIncomingCall(null);
      setIsInCall(true);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('call:end', {
        to: incomingCall.from,
        from: user._id
      });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (activeCall) {
      socket.emit('call:end', {
        to: activeCall.targetUser._id,
        from: user._id
      });
    }

    // Cleanup
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setActiveCall(null);
    setIncomingCall(null);
    setIsInCall(false);
  };

  return {
    activeCall,
    incomingCall,
    isInCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    localStream: localStreamRef.current
  };
};

export default useVideoCall; 