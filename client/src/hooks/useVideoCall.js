import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');

export const useVideoCall = (user, activeChat) => {
  const [callType, setCallType] = useState(null); // 'voice' | 'video' | null
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [peer, setPeer] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callQuality, setCallQuality] = useState('good'); // 'good', 'poor', 'excellent'
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting', 'connected', 'disconnected'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // Audio refs for ring sounds
  const ringtoneRef = useRef(null);
  const callEndRef = useRef(null);
  const callTimerRef = useRef(null);
  
  // Initialize audio elements
  useEffect(() => {
    // Create audio elements for ring sounds with fallback
    ringtoneRef.current = new Audio();
    // Try to load ringtone, fallback to system beep if not available
    ringtoneRef.current.src = '/ringtone.mp3';
    ringtoneRef.current.loop = true;
    ringtoneRef.current.volume = 0.5;
    ringtoneRef.current.onerror = () => {
      console.log('Ringtone not found, using system beep');
      // Create a simple beep sound using Web Audio API as fallback
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      ringtoneRef.current = { play: () => oscillator.start(), pause: () => oscillator.stop(), currentTime: 0 };
    };
    
    callEndRef.current = new Audio();
    callEndRef.current.src = '/call-end.mp3';
    callEndRef.current.volume = 0.3;
    callEndRef.current.onerror = () => {
      console.log('Call end sound not found, using system beep');
      // Create a simple beep sound using Web Audio API as fallback
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      callEndRef.current = { play: () => oscillator.start(), pause: () => oscillator.stop(), currentTime: 0 };
    };
    
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
      if (callEndRef.current) {
        callEndRef.current.pause();
        callEndRef.current = null;
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!user?._id) return;
    
    socket.emit('join', user._id);
    
    // Enhanced incoming call handling with ring sound
    socket.on('call:incoming', ({ from, callType }) => {
      setIncomingCall({ from, callType });
      // Play ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.play().catch(err => console.log('Ringtone play failed:', err));
      }
    });
    
    // Enhanced call acceptance
    socket.on('call:accepted', ({ from }) => {
      if (peer) {
        peer.signal(peer._lastOffer);
        setConnectionStatus('connected');
      }
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    });
    
    // Enhanced signal handling
    socket.on('call:signal', ({ from, signal }) => {
      if (peer) {
        peer.signal(signal);
        setConnectionStatus('connected');
      }
    });
    
    // Enhanced call ending
    socket.on('call:ended', ({ from }) => {
      endCall();
      // Play call end sound
      if (callEndRef.current) {
        callEndRef.current.play().catch(err => console.log('Call end sound failed:', err));
      }
    });
    
    // ICE candidate handling for better connection
    socket.on('ice-candidate', ({ candidate, fromUserId }) => {
      if (peer && fromUserId === (activeChat?._id || incomingCall?.from)) {
        peer.signal({ type: 'candidate', candidate });
      }
    });
    
    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:signal');
      socket.off('call:ended');
      socket.off('ice-candidate');
    };
  }, [user?._id, peer, activeChat, incomingCall]);

  // Call duration timer
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

  // Enhanced call quality monitoring
  useEffect(() => {
    if (peer && remoteStream) {
      const checkQuality = () => {
        if (remoteStream.getVideoTracks().length > 0) {
          const videoTrack = remoteStream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          const width = settings.width || 0;
          const height = settings.height || 0;
          
          if (width >= 1280 && height >= 720) {
            setCallQuality('excellent');
          } else if (width >= 640 && height >= 480) {
            setCallQuality('good');
          } else {
            setCallQuality('poor');
          }
        }
      };
      
      const qualityInterval = setInterval(checkQuality, 5000);
      return () => clearInterval(qualityInterval);
    }
  }, [peer, remoteStream]);

  const startCall = useCallback(async (type) => {
    try {
      setCallType(type);
      setCallActive(true);
      setConnectionStatus('connecting');
      
      const media = type === 'video'
        ? { video: true, audio: true }
        : { video: false, audio: true };
      
      const localStream = await navigator.mediaDevices.getUserMedia(media);
      setStream(localStream);
      
      const newPeer = new Peer({
        initiator: true,
        trickle: true, // Enable ICE trickling for better connection
        stream: localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });
      
      newPeer.on('signal', (signal) => {
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
        setRemoteStream(remote);
        setConnectionStatus('connected');
      });
      
      newPeer.on('connect', () => {
        setConnectionStatus('connected');
      });
      
      newPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setConnectionStatus('disconnected');
      });
      
      setPeer(newPeer);
    } catch (err) {
      console.error('Failed to start call:', err);
      setCallActive(false);
      setCallType(null);
      setConnectionStatus('disconnected');
    }
  }, [activeChat, user]);

  const acceptCall = useCallback(async () => {
    try {
      setCallType(incomingCall.callType);
      setCallActive(true);
      setConnectionStatus('connecting');
      setIncomingCall(null);
      
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
      
      const media = incomingCall.callType === 'video'
        ? { video: true, audio: true }
        : { video: false, audio: true };
      
      const localStream = await navigator.mediaDevices.getUserMedia(media);
      setStream(localStream);
      
      const newPeer = new Peer({
        initiator: false,
        trickle: true,
        stream: localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });
      
      newPeer.on('signal', (signal) => {
        socket.emit('call:signal', {
          to: incomingCall.from,
          from: user._id,
          signal
        });
      });
      
      newPeer.on('stream', (remote) => {
        setRemoteStream(remote);
        setConnectionStatus('connected');
      });
      
      newPeer.on('connect', () => {
        setConnectionStatus('connected');
      });
      
      newPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
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
    }
  }, [incomingCall, user]);

  const declineCall = useCallback(() => {
    setIncomingCall(null);
    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    socket.emit('call:end', {
      to: incomingCall.from,
      from: user._id
    });
  }, [incomingCall, user]);

  const endCall = useCallback(() => {
    setCallActive(false);
    setCallType(null);
    setRemoteStream(null);
    setStream(null);
    setConnectionStatus('disconnected');
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    
    if (peer) {
      peer.destroy();
      setPeer(null);
    }
    
    // Stop ringtone if playing
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
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
      }
    }
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [stream]);

  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    callType,
    callActive,
    incomingCall,
    stream,
    remoteStream,
    callQuality,
    connectionStatus,
    callDuration,
    isMuted,
    isVideoOff,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    formatDuration
  };
}; 