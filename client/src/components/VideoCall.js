import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const VideoCall = ({ 
  callId, 
  targetUser, 
  isIncoming = false, 
  onAccept, 
  onReject, 
  onEnd,
  onClose,
  user 
}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socketRef.current = socket;

    // Join user's room for signaling
    socket.emit('join', user._id);

    // Socket event handlers
    socket.on('offer', async (data) => {
      try {
        console.log('Received offer from:', data.callerId);
        if (!peerConnectionRef.current) return;
        
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        console.log('Sending answer to:', data.callerId);
        socket.emit('answer', {
          targetUserId: data.callerId,
          answer: answer,
          answererId: user._id
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    socket.on('answer', async (data) => {
      try {
        console.log('Received answer from:', data.answererId);
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    socket.on('ice-candidate', async (data) => {
      try {
        console.log('Received ICE candidate from:', data.fromUserId);
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    socket.on('call-ended', (data) => {
      handleEndCall();
    });

    initializeCall();
    
    return () => {
      cleanup();
      socket.disconnect();
    };
  }, [callId, user._id]);

  useEffect(() => {
    if (isConnected) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected]);

  const initializeCall = async () => {
    try {
      setIsLoading(true);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize peer connection
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream:', event.streams[0]);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('ice-candidate', {
            targetUserId: targetUser._id,
            candidate: event.candidate,
            fromUserId: user._id
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true);
          setIsLoading(false);
        } else if (peerConnection.connectionState === 'failed') {
          console.error('WebRTC connection failed');
          setIsLoading(false);
        }
      };

      // Handle ICE connection state
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
      };

      // If not incoming call, create offer
      if (!isIncoming) {
        console.log('Creating offer for call...');
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        console.log('Sending offer to:', targetUser._id);
        socketRef.current?.emit('offer', {
          targetUserId: targetUser._id,
          offer: offer,
          callerId: user._id
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize call:', error);
      setIsLoading(false);
    }
  };

  const handleAcceptCall = async () => {
    try {
      if (!peerConnectionRef.current) return;

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socketRef.current?.emit('answer', {
        targetUserId: targetUser._id,
        answer: answer,
        answererId: user._id
      });

      onAccept?.();
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleRejectCall = () => {
    onReject?.();
    cleanup();
  };

  const handleEndCall = () => {
    onEnd?.();
    cleanup();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    onClose?.();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* Remote Video */}
        {remoteStream && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* Local Video (Picture-in-Picture) */}
        {localStream && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Call Info Overlay */}
        <div className="absolute top-4 left-4 text-white">
          <div className="flex items-center space-x-2">
            <img
              src={targetUser?.profileImage || 'https://via.placeholder.com/40x40'}
              alt={targetUser?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="font-semibold">{targetUser?.username}</div>
              {isConnected && (
                <div className="text-sm opacity-80">
                  {formatDuration(callDuration)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>{isIncoming ? 'Incoming call...' : 'Connecting...'}</p>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isMuted ? 'bg-red-600' : 'bg-gray-600'
            } text-white`}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isVideoOff ? 'bg-red-600' : 'bg-gray-600'
            } text-white`}
          >
            {isVideoOff ? '📹' : '📷'}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center"
          >
            📞
          </button>
        </div>

        {/* Incoming Call Overlay */}
        {isIncoming && !isConnected && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📞</div>
              <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
              <p className="text-lg mb-6">{targetUser?.username}</p>
              <div className="flex space-x-4">
                <button
                  onClick={handleAcceptCall}
                  className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl"
                >
                  ✓
                </button>
                <button
                  onClick={handleRejectCall}
                  className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall; 