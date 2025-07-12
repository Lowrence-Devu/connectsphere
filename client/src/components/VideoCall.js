import React, { useRef, useEffect } from 'react';
import { useVideoCall } from '../hooks/useVideoCall';
import VideoCallDebug from './VideoCallDebug';

const VideoCall = ({ user, activeChat, onClose }) => {
  const {
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
    formatDuration,
    peer
  } = useVideoCall(user, activeChat);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const localAudioRef = useRef();
  const remoteAudioRef = useRef();

  // Update video and audio elements when streams change
  useEffect(() => {
    if (localVideoRef.current && stream && callType === 'video') {
      localVideoRef.current.srcObject = stream;
    }
    if (remoteVideoRef.current && remoteStream && callType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    
    // Handle audio for voice calls
    if (localAudioRef.current && stream && callType === 'voice') {
      localAudioRef.current.srcObject = stream;
    }
    if (remoteAudioRef.current && remoteStream && callType === 'voice') {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [stream, remoteStream, callType]);

  const getQualityColor = () => {
    switch (callQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  if (!callActive && !incomingCall) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      {/* Debug Panel */}
      <VideoCallDebug
        callType={callType}
        callActive={callActive}
        connectionStatus={connectionStatus}
        callQuality={callQuality}
        stream={stream}
        remoteStream={remoteStream}
        peer={peer}
        user={user}
        activeChat={activeChat}
      />
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {callType === 'voice' ? 'Voice Call' : 'Video Call'}
            </h2>
            {callActive && (
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                  {getConnectionStatusText()}
                </span>
                <span className={`text-sm font-medium ${getQualityColor()}`}>
                  {callQuality.charAt(0).toUpperCase() + callQuality.slice(1)} Quality
                </span>
                {callDuration > 0 && (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {formatDuration(callDuration)}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Call Content */}
        {callActive ? (
          <div className="flex flex-col items-center space-y-6">
            {/* Video/Audio Display */}
            <div className="relative w-full max-w-2xl">
              {/* In the video call UI, always show the local video/audio element, even if remoteStream is not available */}
              {/* For video calls: */}
              {callType === 'video' ? (
                <div className="relative">
                  {/* Remote Video or Waiting Placeholder */}
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 md:h-96 rounded-lg bg-gray-900"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-96 rounded-lg bg-gray-900 flex items-center justify-center text-white text-lg">
                      Waiting for other user to join...
                    </div>
                  )}
                  {/* Local Video (Picture-in-Picture) - Always show */}
                  <div className="absolute top-4 right-4">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-32 h-24 rounded-lg bg-gray-800 border-2 border-white"
                    />
                  </div>
                  {/* Connection Status Overlay */}
                  {connectionStatus !== 'connected' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm">{getConnectionStatusText()}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  {/* Hidden audio elements for voice calls - Always attach local audio */}
                  <audio ref={localAudioRef} autoPlay muted />
                  <audio ref={remoteAudioRef} autoPlay />
                  
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-6xl">🎤</span>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-800 dark:text-white">
                      Voice Call with {activeChat?.username}
                    </p>
                    {!remoteStream && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Waiting for other user to join...
                      </p>
                    )}
                    {connectionStatus !== 'connected' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {getConnectionStatusText()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center space-x-4">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMuted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </button>

              {/* Video Toggle (only for video calls) */}
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-colors ${
                    isVideoOff
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  title={isVideoOff ? 'Turn on video' : 'Turn off video'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isVideoOff ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>
              )}

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="End call"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Incoming Call UI */
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">
                  {incomingCall?.callType === 'voice' ? '📞' : '🎥'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Incoming {incomingCall?.callType === 'voice' ? 'Voice' : 'Video'} Call
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeChat?.username} is calling...
              </p>
            </div>

            {/* Call Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={acceptCall}
                className="px-8 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Accept</span>
              </button>

              <button
                onClick={declineCall}
                className="px-8 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Decline</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall; 