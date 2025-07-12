import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');

const DM = ({
  inbox = [],
  activeChat,
  messages = [],
  onSelectChat,
  onSendMessage,
  messageText,
  setMessageText,
  user,
  chatLoading,
  onNavigateToProfile
}) => {
  const [callType, setCallType] = useState(null); // 'voice' | 'video' | null
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { from, callType }
  const [peer, setPeer] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    if (!user?._id) return;
    socket.emit('join', user._id);
    // Listen for incoming call
    socket.on('call:incoming', ({ from, callType }) => {
      setIncomingCall({ from, callType });
    });
    socket.on('call:accepted', ({ from }) => {
      if (peer) peer.signal(peer._lastOffer);
    });
    socket.on('call:signal', ({ from, signal }) => {
      if (peer) peer.signal(signal);
    });
    socket.on('call:ended', ({ from }) => {
      endCall();
    });
    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:signal');
      socket.off('call:ended');
    };
    // eslint-disable-next-line
  }, [user?._id, peer]);

  const startCall = async (type) => {
    setCallType(type);
    setCallActive(true);
    const media = type === 'video'
      ? { video: true, audio: true }
      : { video: false, audio: true };
    const localStream = await navigator.mediaDevices.getUserMedia(media);
    setStream(localStream);
    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream
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
    });
    setPeer(newPeer);
    if (localVideoRef.current && type === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  };

  const acceptCall = async () => {
    setCallType(incomingCall.callType);
    setCallActive(true);
    setIncomingCall(null);
    const media = incomingCall.callType === 'video'
      ? { video: true, audio: true }
      : { video: false, audio: true };
    const localStream = await navigator.mediaDevices.getUserMedia(media);
    setStream(localStream);
    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream
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
    });
    setPeer(newPeer);
    socket.emit('call:accept', {
      to: incomingCall.from,
      from: user._id
    });
    if (localVideoRef.current && incomingCall.callType === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  };

  const declineCall = () => {
    setIncomingCall(null);
    socket.emit('call:end', {
      to: incomingCall.from,
      from: user._id
    });
  };

  const endCall = () => {
    setCallActive(false);
    setCallType(null);
    setRemoteStream(null);
    setStream(null);
    if (peer) peer.destroy();
    setPeer(null);
    socket.emit('call:end', {
      to: activeChat?._id || (incomingCall && incomingCall.from),
      from: user._id
    });
  };

  useEffect(() => {
    if (localVideoRef.current && stream && callType === 'video') {
      localVideoRef.current.srcObject = stream;
    }
    if (remoteVideoRef.current && remoteStream && callType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [stream, remoteStream, callType]);

  return (
    <div className="flex h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Sidebar: Inbox */}
      <div className="w-1/3 min-w-[180px] max-w-xs border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
        <div className="p-4 font-bold text-lg text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">Inbox</div>
        {inbox.length === 0 ? (
          <div className="p-4 text-gray-400 dark:text-gray-500 text-center">No conversations yet.</div>
        ) : (
          inbox.map(chatUser => (
            <div
              key={chatUser._id}
              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${activeChat?._id === chatUser._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => onSelectChat(chatUser)}
            >
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden mr-3"
                onClick={e => { e.stopPropagation(); onNavigateToProfile && onNavigateToProfile(chatUser); }}
                title="View profile"
                style={{ cursor: 'pointer' }}
              >
                {chatUser.profileImage ? (
                  <img src={chatUser.profileImage} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">{chatUser.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{chatUser.username}</span>
            </div>
          ))
        )}
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="flex items-center space-x-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {activeChat.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="font-bold text-gray-800 dark:text-white flex-1">{activeChat.username}</div>
              {/* Call Buttons */}
              <button
                className="ml-2 p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                title="Voice Call"
                onClick={() => startCall('voice')}
              >
                <span role="img" aria-label="Voice Call">📞</span>
              </button>
              <button
                className="ml-2 p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                title="Video Call"
                onClick={() => startCall('video')}
              >
                <span role="img" aria-label="Video Call">🎥</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white dark:bg-gray-900">
              {chatLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400 dark:text-gray-500 text-center">No messages yet. Say hi!</div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={msg._id || idx}
                    className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm ${msg.sender._id === user._id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'}`}>
                      <div>{msg.text}</div>
                      <div className="text-xs text-gray-300 dark:text-gray-400 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={e => { e.preventDefault(); onSendMessage(); }} className="flex items-center p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                placeholder="Type a message..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-200"
                disabled={!messageText.trim()}
              >
                Send
              </button>
            </form>
            {/* Call Modal */}
            {callActive && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative flex flex-col items-center">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={endCall}>
                    ✕
                  </button>
                  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{callType === 'voice' ? 'Voice Call' : 'Video Call'}</h2>
                  <div className="mb-4 flex flex-col items-center">
                    {callType === 'video' ? (
                      <>
                        <video ref={localVideoRef} autoPlay muted playsInline className="w-32 h-32 rounded-lg mb-2 border-2 border-blue-400" />
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-40 h-40 rounded-lg border-2 border-green-400" />
                      </>
                    ) : (
                      <>
                        <audio ref={localVideoRef} autoPlay muted />
                        <audio ref={remoteVideoRef} autoPlay />
                        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-4xl text-blue-600 dark:text-blue-300">🎤</div>
                      </>
                    )}
                  </div>
                  <button
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                    onClick={endCall}
                  >
                    Hang Up
                  </button>
                </div>
              </div>
            )}
            {/* Incoming Call Modal */}
            {incomingCall && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-xs relative flex flex-col items-center">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Incoming {incomingCall.callType === 'voice' ? 'Voice' : 'Video'} Call</h2>
                  <div className="mb-4">
                    <span className="text-4xl">{incomingCall.callType === 'voice' ? '📞' : '🎥'}</span>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                      onClick={acceptCall}
                    >
                      Accept
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                      onClick={declineCall}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

export default DM; 