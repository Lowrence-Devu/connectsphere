import React from 'react';

const VideoCallDebug = ({ 
  callType, 
  callActive, 
  connectionStatus, 
  callQuality, 
  stream, 
  remoteStream, 
  peer,
  user,
  activeChat,
  error,
  connectionStats
}) => {
  if (!callActive) return null;

  const getStreamInfo = (stream, name) => {
    if (!stream) return 'No stream';
    
    const tracks = stream.getTracks();
    const audioTracks = tracks.filter(track => track.kind === 'audio');
    const videoTracks = tracks.filter(track => track.kind === 'video');
    
    return {
      audioTracks: audioTracks.length,
      videoTracks: videoTracks.length,
      enabled: tracks.map(track => track.enabled),
      muted: audioTracks.length > 0 ? !audioTracks[0].enabled : false,
      videoOff: videoTracks.length > 0 ? !videoTracks[0].enabled : false,
      readyState: tracks.map(track => track.readyState)
    };
  };

  const localStreamInfo = getStreamInfo(stream, 'Local');
  const remoteStreamInfo = getStreamInfo(remoteStream, 'Remote');

  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Video Call Debug</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Call Type:</strong> {callType}
        </div>
        
        <div>
          <strong>Connection:</strong> {connectionStatus}
        </div>
        
        <div>
          <strong>Quality:</strong> {callQuality}
        </div>
        
        {error && (
          <div className="text-red-300">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div>
          <strong>User:</strong> {user?.username} ({user?._id})
        </div>
        
        <div>
          <strong>Chat:</strong> {activeChat?.username} ({activeChat?._id})
        </div>
        
        <div>
          <strong>Peer:</strong> {peer ? 'Connected' : 'Not connected'}
        </div>
        
        {connectionStats && (
          <div className="border-t border-gray-600 pt-2">
            <strong>Connection Stats:</strong>
            <div className="ml-2">
              Received: {Math.round(connectionStats.bytesReceived / 1024)}KB
            </div>
            <div className="ml-2">
              Sent: {Math.round(connectionStats.bytesSent / 1024)}KB
            </div>
            <div className="ml-2">
              Timestamp: {new Date(connectionStats.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-600 pt-2 mt-2">
          <strong>Local Stream:</strong>
          <div className="ml-2">
            Audio: {localStreamInfo.audioTracks} tracks ({localStreamInfo.muted ? 'Muted' : 'Active'})
          </div>
          <div className="ml-2">
            Video: {localStreamInfo.videoTracks} tracks ({localStreamInfo.videoOff ? 'Off' : 'On'})
          </div>
          <div className="ml-2">
            Ready States: {localStreamInfo.readyState?.join(', ') || 'N/A'}
          </div>
        </div>
        
        <div className="border-t border-gray-600 pt-2">
          <strong>Remote Stream:</strong>
          <div className="ml-2">
            Audio: {remoteStreamInfo.audioTracks} tracks
          </div>
          <div className="ml-2">
            Video: {remoteStreamInfo.videoTracks} tracks
          </div>
          <div className="ml-2">
            Ready States: {remoteStreamInfo.readyState?.join(', ') || 'N/A'}
          </div>
        </div>
        
        <div className="border-t border-gray-600 pt-2">
          <strong>Browser Support:</strong>
          <div className="ml-2">
            getUserMedia: {navigator.mediaDevices?.getUserMedia ? '✅' : '❌'}
          </div>
          <div className="ml-2">
            RTCPeerConnection: {window.RTCPeerConnection ? '✅' : '❌'}
          </div>
          <div className="ml-2">
            WebRTC: {window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia ? '✅' : '❌'}
          </div>
          <div className="ml-2">
            Audio Context: {window.AudioContext || window.webkitAudioContext ? '✅' : '❌'}
          </div>
        </div>
        
        <div className="border-t border-gray-600 pt-2">
          <strong>Network Info:</strong>
          <div className="ml-2">
            Connection: {navigator.connection?.effectiveType || 'Unknown'}
          </div>
          <div className="ml-2">
            Downlink: {navigator.connection?.downlink || 'Unknown'} Mbps
          </div>
          <div className="ml-2">
            RTT: {navigator.connection?.rtt || 'Unknown'} ms
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallDebug; 