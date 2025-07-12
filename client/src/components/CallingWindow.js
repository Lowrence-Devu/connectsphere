import React, { useRef, useEffect } from 'react';

const CallingWindow = ({ 
  callType, 
  targetUser, 
  onCancel, 
  stream, 
  callDuration = 0,
  connectionStatus = 'connecting'
}) => {
  const localVideoRef = useRef();
  const localAudioRef = useRef();

  // Attach local stream for preview
  useEffect(() => {
    try {
      if (localVideoRef.current && stream && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      if (localAudioRef.current && stream && callType === 'voice') {
        localAudioRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('[CallingWindow] Error attaching local stream:', err);
    }
  }, [stream, callType]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Calling...';
      case 'connected': return 'Connected';
      case 'disconnected': return 'Call ended';
      default: return 'Connecting...';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting': return 'text-yellow-500';
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {callType === 'voice' ? 'Voice Call' : 'Video Call'}
          </h2>
          <p className={`text-sm font-medium ${getConnectionStatusColor()}`}>
            {getConnectionStatusText()}
          </p>
          {callDuration > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formatDuration(callDuration)}
            </p>
          )}
        </div>

        {/* Call Content */}
        <div className="flex flex-col items-center space-y-6">
          {/* Video/Audio Display */}
          <div className="relative w-full">
            {callType === 'video' ? (
              <div className="relative">
                {/* Local Video Preview */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-48 rounded-lg bg-gray-900"
                />
                {/* Calling Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Calling...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                {/* Hidden audio element for voice calls */}
                <audio ref={localAudioRef} autoPlay muted />
                
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-6xl">🎤</span>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-800 dark:text-white">
                    Calling {targetUser?.username}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Voice call
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Target User Info */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              {targetUser?.profileImage ? (
                <img 
                  src={targetUser.profileImage} 
                  alt="avatar" 
                  className="w-16 h-16 rounded-full object-cover" 
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {targetUser?.username?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {targetUser?.username || 'Unknown User'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {callType === 'voice' ? 'Voice call' : 'Video call'} • {new Date().toLocaleTimeString()}
            </p>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-4">
            {/* Cancel Call Button */}
            <button
              onClick={onCancel}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Cancel call"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Status Messages */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Waiting for {targetUser?.username} to answer...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              You can cancel the call at any time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallingWindow; 