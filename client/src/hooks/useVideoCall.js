import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import { usePushNotifications } from './usePushNotifications';

// Enhanced socket connection with better error handling
const getSocketUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  console.log('[Socket] API URL:', apiUrl);
  
  if (apiUrl) {
    const socketUrl = apiUrl.replace('/api', '');
    console.log('[Socket] Using socket URL:', socketUrl);
    return socketUrl;
  }
  
  // Fallback for production
  if (window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.hostname}`;
    console.log('[Socket] Using fallback socket URL:', socketUrl);
    return socketUrl;
  }
  
  console.log('[Socket] Using localhost fallback');
  return 'http://localhost:5000';
};

const socket = io(getSocketUrl(), {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
});

// Add socket connection debugging
socket.on('connect', () => {
  console.log('[Socket] Connected successfully');
});

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
});

// Helper to check if an object is a real HTMLAudioElement
function isRealAudioElement(obj) {
  return obj instanceof window.HTMLAudioElement;
}

export const useVideoCall = (user, activeChat) => {
  const [callType, setCallType] = useState(null); // 'voice' | 'video' | null
  const [callActive, setCallActive] = useState(false);
  const [calling, setCalling] = useState(false); // New state for when user is calling but not connected
  const [incomingCall, setIncomingCall] = useState(null);
  const [peer, setPeer] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callQuality, setCallQuality] = useState('good'); // 'good', 'poor', 'excellent'
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting', 'connected', 'disconnected'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStats, setConnectionStats] = useState(null);
  const [error, setError] = useState(null);
  
  // Audio refs for ring sounds
  const ringtoneRef = useRef(null);
  const callEndRef = useRef(null);
  const callTimerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const qualityCheckIntervalRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Get push notification functions
  const { showIncomingCallNotification, showNotification } = usePushNotifications();
  
  // Initialize audio elements with better error handling
  useEffect(() => {
    const initAudio = () => {
      try {
        // Create audio elements for ring sounds with fallback
        ringtoneRef.current = new Audio();
        ringtoneRef.current.src = '/ringtone.mp3';
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 0.5;
        ringtoneRef.current.onerror = () => {
          console.log('Ringtone not found, using system beep');
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          let oscillator = null;
          let started = false;
          const gainNode = audioContext.createGain();
          gainNode.connect(audioContext.destination);
          ringtoneRef.current = {
            play: () => {
              if (!oscillator) {
                oscillator = audioContext.createOscillator();
                oscillator.connect(gainNode);
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                try {
                  oscillator.start();
                  started = true;
                } catch (e) {
                  console.log('Oscillator start failed:', e);
                }
              }
            },
            pause: () => {
              if (oscillator && started) {
                try {
                  oscillator.stop();
                } catch (e) {
                  console.log('Oscillator stop failed:', e);
                }
                oscillator = null;
                started = false;
              }
            },
            currentTime: 0,
            get oscillator() { return oscillator; }
          };
        };
        
        callEndRef.current = new Audio();
        callEndRef.current.src = '/call-end.mp3';
        callEndRef.current.volume = 0.3;
        callEndRef.current.onerror = () => {
          console.log('Call end sound not found, using system beep');
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          let oscillator = null;
          let started = false;
          const gainNode = audioContext.createGain();
          gainNode.connect(audioContext.destination);
          callEndRef.current = {
            play: () => {
              if (!oscillator) {
                oscillator = audioContext.createOscillator();
                oscillator.connect(gainNode);
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                try {
                  oscillator.start();
                  started = true;
                  setTimeout(() => {
                    if (oscillator && started) {
                      try { oscillator.stop(); } catch (e) {}
                      oscillator = null;
                      started = false;
                    }
                  }, 200);
                } catch (e) {
                  console.log('Call end oscillator failed:', e);
                }
              }
            },
            pause: () => {
              if (oscillator && started) {
                try { oscillator.stop(); } catch (e) {}
                oscillator = null;
                started = false;
              }
            },
            currentTime: 0
          };
        };
        
        // Ensure refs are initialized even if audio fails
        if (!ringtoneRef.current) {
          ringtoneRef.current = { play: () => {}, pause: () => {}, currentTime: 0 };
        }
        if (!callEndRef.current) {
          callEndRef.current = { play: () => {}, pause: () => {}, currentTime: 0 };
        }
        
      } catch (err) {
        console.error('Audio initialization failed:', err);
        // Set fallback refs
        ringtoneRef.current = { play: () => {}, pause: () => {}, currentTime: 0 };
        callEndRef.current = { play: () => {}, pause: () => {}, currentTime: 0 };
      }
    };

    initAudio();
    
    return () => {
      if (ringtoneRef.current) {
        try {
          ringtoneRef.current.pause();
          if (ringtoneRef.current.oscillator) {
            try { ringtoneRef.current.oscillator.stop(); } catch (e) {}
          }
        } catch (e) {}
        ringtoneRef.current = null;
      }
      if (callEndRef.current) {
        try {
          callEndRef.current.pause();
        } catch (e) {}
        callEndRef.current = null;
      }
    };
  }, []);

  // Enhanced connection quality monitoring
  const monitorConnectionQuality = useCallback(() => {
    if (!peer || !remoteStream) return;

    try {
      const videoTrack = remoteStream.getVideoTracks()[0];
      const audioTrack = remoteStream.getAudioTracks()[0];
      
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        const width = settings.width || 0;
        const height = settings.height || 0;
        
        // Check resolution and frame rate
        const frameRate = settings.frameRate || 0;
        
        if (width >= 1280 && height >= 720 && frameRate >= 24) {
          setCallQuality('excellent');
        } else if (width >= 640 && height >= 480 && frameRate >= 15) {
          setCallQuality('good');
        } else {
          setCallQuality('poor');
        }
      }
      
      // Monitor connection stats if available
      if (peer.getStats) {
        peer.getStats().then(stats => {
          let totalBytesReceived = 0;
          let totalBytesSent = 0;
          
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
              totalBytesReceived += report.bytesReceived || 0;
            }
            if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
              totalBytesSent += report.bytesSent || 0;
            }
          });
          
          setConnectionStats({
            bytesReceived: totalBytesReceived,
            bytesSent: totalBytesSent,
            timestamp: Date.now()
          });
        }).catch(err => {
          console.log('Stats monitoring failed:', err);
        });
      }
    } catch (err) {
      console.error('Quality monitoring error:', err);
    }
  }, [peer, remoteStream]);

  // Socket event handling with improved error recovery
  useEffect(() => {
    if (!user?._id) return;

    socket.emit('join', user._id);

    const handleIncomingCall = ({ from, callType }) => {
      console.log('[Socket] Incoming call from:', from, 'type:', callType);
      setIncomingCall({ from, callType });
      setError(null);
      
      // Show browser notification for incoming call
      if (activeChat?.username) {
        notificationRef.current = showIncomingCallNotification(activeChat.username, callType);
      }
      
      if (ringtoneRef.current) {
        try {
          const playResult = ringtoneRef.current && ringtoneRef.current.play && ringtoneRef.current.play();
          // Only call .catch() if playResult is a Promise (real Audio element)
          if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(err => console.log('Ringtone play failed:', err));
          }
        } catch (err) {
          console.log('Ringtone play error:', err);
        }
      }
    };

    const handleCallAccepted = ({ from }) => {
      console.log('[Socket] Call accepted by:', from);
      if (peer) {
        try {
          peer.signal(peer._lastOffer);
          setConnectionStatus('connected');
        } catch (err) {
          console.error('[Socket] Error signaling peer:', err);
          setError('Connection failed. Please try again.');
        }
      }
      if (ringtoneRef.current) {
        try {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        } catch (err) {
          console.log('Ringtone pause error:', err);
        }
      }
      // Close browser notification if exists
      if (notificationRef.current) {
        notificationRef.current.close();
        notificationRef.current = null;
      }
    };

    const handleCallSignal = ({ from, signal }) => {
      console.log('[Socket] Received signal from:', from, signal);
      if (peer) {
        try {
          peer.signal(signal);
          setConnectionStatus('connected');
          setError(null);
        } catch (err) {
          console.error('[Socket] Error signaling peer:', err);
          setError('Signal processing failed. Please try again.');
        }
      }
    };

    const handleCallEnded = ({ from }) => {
      console.log('[Socket] Call ended by:', from);
      endCall();
      if (callEndRef.current) {
        try {
          const playResult = callEndRef.current && callEndRef.current.play && callEndRef.current.play();
          // Only call .catch() if playResult is a Promise (real Audio element)
          if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(err => console.log('Call end sound failed:', err));
          }
        } catch (err) {
          console.log('Call end sound error:', err);
        }
      }
      // Close browser notification if exists
      if (notificationRef.current) {
        notificationRef.current.close();
        notificationRef.current = null;
      }
    };

    const handleIceCandidate = ({ from, candidate }) => {
      console.log('[Socket] ICE candidate from:', from, candidate);
      if (peer && (from === (activeChat?._id || incomingCall?.from))) {
        try {
          peer.signal({ type: 'candidate', candidate });
        } catch (err) {
          console.error('[Socket] Error handling ICE candidate:', err);
        }
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:signal', handleCallSignal);
    socket.on('call:ended', handleCallEnded);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:signal', handleCallSignal);
      socket.off('call:ended', handleCallEnded);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [user?._id, peer, activeChat, incomingCall]);

  // Handle notification clicks
  useEffect(() => {
    const handleNotificationClick = (event) => {
      console.log('[Notification] Clicked:', event.detail);
      // Ensure the call UI is visible when notification is clicked
      if (incomingCall) {
        // The call UI should already be showing, but we can ensure it's focused
        window.focus();
      }
    };

    window.addEventListener('incomingCallClicked', handleNotificationClick);

    return () => {
      window.removeEventListener('incomingCallClicked', handleNotificationClick);
    };
  }, [incomingCall]);

  // Enhanced stream monitoring
  useEffect(() => {
    if (stream) {
      console.log('Local stream tracks:', stream.getTracks().map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled,
        readyState: t.readyState 
      })));
    }
  }, [stream]);

  useEffect(() => {
    if (remoteStream) {
      const audioTracks = remoteStream.getAudioTracks();
      const videoTracks = remoteStream.getVideoTracks();
      console.log('[Stream] Remote stream tracks:', {
        audio: audioTracks.map(t => ({ enabled: t.enabled, readyState: t.readyState })),
        video: videoTracks.map(t => ({ enabled: t.enabled, readyState: t.readyState }))
      });
    }
  }, [remoteStream]);

  // Call duration timer with better cleanup
  useEffect(() => {
    if (callActive && connectionStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callActive, connectionStatus]);

  // Quality monitoring with adaptive intervals
  useEffect(() => {
    if (peer && remoteStream) {
      // Initial quality check
      monitorConnectionQuality();
      
      // Set up periodic quality monitoring
      qualityCheckIntervalRef.current = setInterval(monitorConnectionQuality, 3000);
      
      return () => {
        if (qualityCheckIntervalRef.current) {
          clearInterval(qualityCheckIntervalRef.current);
        }
      };
    }
  }, [peer, remoteStream, monitorConnectionQuality]);

  // Always stop ringtone when call is active or connected
  useEffect(() => {
    if (callActive || connectionStatus === 'connected') {
      if (ringtoneRef.current) {
        try {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        } catch (e) {
          console.log('Ringtone stop error:', e);
        }
      }
    }
  }, [callActive, connectionStatus]);

  // Enhanced call start with better error handling
  const startCall = useCallback(async (type) => {
    try {
      console.log('Starting call:', type);
      setCallType(type);
      setCallActive(true);
      setCalling(true); // Set calling state
      setConnectionStatus('connecting');
      setError(null);
      
      const media = type === 'video'
        ? { 
            video: { 
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 }
            }, 
            audio: { 
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          }
        : { 
            video: false, 
            audio: { 
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          };
      
      const localStream = await navigator.mediaDevices.getUserMedia(media);
      setStream(localStream);
      console.log('Local stream obtained:', localStream.getTracks().map(t => t.kind));
      
      const newPeer = new Peer({
        initiator: true,
        trickle: true,
        stream: localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });
      
      newPeer.on('signal', (signal) => {
        console.log('Sending signal for call:', type);
        newPeer._lastOffer = signal;
        socket.emit('call:request', {
          to: activeChat._id,
          from: user._id,
          callType: type
        });
        socket.emit('call:signal', {
          to: activeChat._id,
          from: user._id,
          signal
        });
      });
      
      newPeer.on('stream', (remote) => {
        console.log('Received remote stream');
        setRemoteStream(remote);
        setConnectionStatus('connected');
        setCalling(false); // Clear calling state when connected
        setError(null);
      });
      
      newPeer.on('connect', () => {
        console.log('Peer connected');
        setConnectionStatus('connected');
        setCalling(false); // Clear calling state when connected
        setError(null);
      });
      
      newPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setConnectionStatus('disconnected');
        setCalling(false); // Clear calling state on error
        setError('Connection failed. Please check your internet connection and try again.');
      });
      
      newPeer.on('close', () => {
        console.log('Peer connection closed');
        setConnectionStatus('disconnected');
        setCalling(false); // Clear calling state when closed
      });
      
      setPeer(newPeer);
    } catch (err) {
      console.error('Failed to start call:', err);
      setCallActive(false);
      setCallType(null);
      setCalling(false); // Clear calling state on error
      setConnectionStatus('disconnected');
      setError('Failed to access camera/microphone. Please check permissions and try again.');
    }
  }, [activeChat, user]);

  // Enhanced call acceptance
  const acceptCall = useCallback(async () => {
    try {
      console.log('Accepting call:', incomingCall.callType);
      setCallType(incomingCall.callType);
      setCallActive(true);
      setConnectionStatus('connecting');
      setIncomingCall(null);
      setError(null);
      
      // Stop ringtone
      if (ringtoneRef.current) {
        try {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        } catch (err) {
          console.log('Ringtone pause error:', err);
        }
      }
      
      const media = incomingCall.callType === 'video'
        ? { 
            video: { 
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 }
            }, 
            audio: { 
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          }
        : { 
            video: false, 
            audio: { 
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          };
      
      const localStream = await navigator.mediaDevices.getUserMedia(media);
      setStream(localStream);
      console.log('Local stream obtained for accepted call:', localStream.getTracks().map(t => t.kind));
      
      const newPeer = new Peer({
        initiator: false,
        trickle: true,
        stream: localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });
      
      newPeer.on('signal', (signal) => {
        console.log('Sending signal for accepted call');
        socket.emit('call:signal', {
          to: incomingCall.from,
          from: user._id,
          signal
        });
      });
      
      newPeer.on('stream', (remote) => {
        console.log('Received remote stream in accepted call');
        setRemoteStream(remote);
        setConnectionStatus('connected');
        setError(null);
      });
      
      newPeer.on('connect', () => {
        console.log('Peer connected in accepted call');
        setConnectionStatus('connected');
        setError(null);
      });
      
      newPeer.on('error', (err) => {
        console.error('Peer connection error in accepted call:', err);
        setConnectionStatus('disconnected');
        setError('Connection failed. Please check your internet connection and try again.');
      });
      
      newPeer.on('close', () => {
        console.log('Peer connection closed in accepted call');
        setConnectionStatus('disconnected');
      });
      
      setPeer(newPeer);
      socket.emit('call:accept', {
        to: incomingCall.from,
        from: user._id
      });
    } catch (err) {
      console.error('Failed to accept call:', err);
      setCallActive(false);
      setCallType(null);
      setConnectionStatus('disconnected');
      setError('Failed to access camera/microphone. Please check permissions and try again.');
    }
  }, [incomingCall, user]);

  const declineCall = useCallback(() => {
    console.log('Declining call');
    setIncomingCall(null);
    setError(null);
    // Stop ringtone
    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      } catch (err) {
        console.log('Ringtone pause error:', err);
      }
    }
    // Close browser notification if exists
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
    socket.emit('call:end', {
      to: incomingCall?.from,
      from: user._id
    });
  }, [incomingCall, user]);

  // Enhanced call ending with proper cleanup
  const endCall = useCallback(() => {
    console.log('Ending call');
    setCallActive(false);
    setCallType(null);
    setCalling(false); // Clear calling state
    setRemoteStream(null);
    setStream(null);
    setConnectionStatus('disconnected');
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setError(null);
    setConnectionStats(null);
    
    // Clear all intervals
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
      qualityCheckIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (peer) {
      try {
        peer.destroy();
      } catch (err) {
        console.log('Peer destroy error:', err);
      }
      setPeer(null);
    }
    
    // Stop ringtone if playing
    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      } catch (e) {
        console.log('Ringtone cleanup error:', e);
      }
    }
    
    // Close browser notification if exists
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
    
    socket.emit('call:end', {
      to: activeChat?._id || (incomingCall && incomingCall.from),
      from: user._id
    });
  }, [peer, activeChat, incomingCall, user]);

  const toggleMute = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log('Audio track enabled:', audioTrack.enabled);
      }
    }
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        console.log('Video track enabled:', videoTrack.enabled);
      }
    }
  }, [stream]);

  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Retry connection function
  const retryConnection = useCallback(() => {
    if (callActive && connectionStatus === 'disconnected') {
      console.log('Retrying connection...');
      setError(null);
      setConnectionStatus('connecting');
      
      // Recreate peer connection
      if (stream) {
        const newPeer = new Peer({
          initiator: true,
          trickle: true,
          stream: stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' }
            ]
          }
        });
        
        newPeer.on('signal', (signal) => {
          socket.emit('call:signal', {
            to: activeChat._id,
            from: user._id,
            signal
          });
        });
        
        newPeer.on('stream', (remote) => {
          setRemoteStream(remote);
          setConnectionStatus('connected');
          setError(null);
        });
        
        newPeer.on('connect', () => {
          setConnectionStatus('connected');
          setError(null);
        });
        
        newPeer.on('error', (err) => {
          console.error('Retry peer error:', err);
          setConnectionStatus('disconnected');
          setError('Reconnection failed. Please try again.');
        });
        
        setPeer(newPeer);
      }
    }
  }, [callActive, connectionStatus, stream, activeChat, user]);

  return {
    callType,
    callActive,
    calling,
    incomingCall,
    stream,
    remoteStream,
    callQuality,
    connectionStatus,
    callDuration,
    isMuted,
    isVideoOff,
    error,
    connectionStats,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    formatDuration,
    retryConnection,
    peer
  };
}; 