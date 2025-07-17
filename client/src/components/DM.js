import React, { useState, useEffect, useRef } from 'react';
import { useVideoCall } from '../hooks/useVideoCall';
import VideoCall from './VideoCall';
import CallingWindow from './CallingWindow';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [mobileView, setMobileView] = useState('sidebar'); // 'sidebar' | 'chat'
  const [showVideoCall, setShowVideoCall] = useState(false);
  
  // Use the enhanced video call hook
  const {
    callType,
    callActive,
    calling,
    incomingCall,
    stream,
    connectionStatus,
    callDuration,
    startCall,
    acceptCall,
    declineCall,
    endCall
  } = useVideoCall(user, activeChat);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      if (activeChat) setMobileView('chat');
      else setMobileView('sidebar');
    }
  }, [isMobile, activeChat]);

  // Handle call state changes
  useEffect(() => {
    if (callActive || incomingCall || calling) {
      setShowVideoCall(true);
    } else {
      setShowVideoCall(false);
    }
  }, [callActive, incomingCall, calling]);

  // Ensure call UI shows when notification is clicked
  useEffect(() => {
    const handleNotificationClick = () => {
      if (incomingCall) {
        setShowVideoCall(true);
      }
    };

    window.addEventListener('incomingCallClicked', handleNotificationClick);
    return () => {
      window.removeEventListener('incomingCallClicked', handleNotificationClick);
    };
  }, [incomingCall]);

  useEffect(() => {
    // Debug: Log inbox data to inspect structure
    if (inbox && inbox.length > 0) {
      console.log('DM Inbox Data:', inbox);
    }
  }, [inbox]);

  return (
    <div className="flex flex-col sm:flex-row h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
      {/* Sidebar: Inbox */}
      {(!isMobile || (isMobile && mobileView === 'sidebar')) && (
        <div className="w-full sm:w-1/3 min-w-[180px] max-w-xs border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
          <div className="p-4 font-bold text-lg text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">Inbox</div>
          {inbox.length === 0 ? (
            <div className="p-4 text-gray-400 dark:text-gray-500 text-center">No conversations yet.</div>
          ) : (
            inbox.map(convo => {
              const chatUser = convo.user;
              const lastMessage = convo.lastMessage;
              const unread = convo.unread;
              return (
              <div
                  key={chatUser?._id || Math.random()}
                  className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${activeChat?._id === chatUser?._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => {
                  onSelectChat(chatUser);
                    setMobileView('chat');
                }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectChat(chatUser); setMobileView('chat'); } }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open chat with ${chatUser?.username || 'Unknown User'}`}
              >
                <div
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden mr-3 shadow-md border-2 border-white dark:border-gray-900"
                  onClick={e => { e.stopPropagation(); onNavigateToProfile && onNavigateToProfile(chatUser); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onNavigateToProfile && onNavigateToProfile(chatUser); } }}
                  title="View profile"
                  style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${chatUser?.username || 'Unknown User'}'s profile`}
                >
                    {chatUser?.profileImage ? (
                    <img src={chatUser.profileImage} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                      <span className="text-white font-bold text-lg">{chatUser?.username?.charAt(0).toUpperCase() || '?'}</span>
                  )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white truncate">{chatUser?.username || 'Unknown User'}</span>
                      {unread > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-semibold shadow-lg animate-pulse" aria-label={`${unread} unread messages`}>{unread}</span>
                      )}
                    </div>
                    {lastMessage ? (
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[180px] font-medium mt-0.5">
                        <span className="font-semibold text-blue-500 dark:text-blue-400">{lastMessage.sender && lastMessage.sender.username ? `${lastMessage.sender.username}: ` : ''}</span>
                        <span>{lastMessage.text || '[No message text]'}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">No messages yet.</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* Chat Area */}
      {(!isMobile || (isMobile && mobileView === 'chat')) && (
        <div className="flex-1 flex flex-col w-full">
          {isMobile && (
            <div className="flex items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                className="mr-2 px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white sm:hidden"
                onClick={() => setMobileView('sidebar')}
                aria-label="Back to inbox"
              >
                ← Back
              </button>
              <div className="font-bold text-gray-800 dark:text-white flex-1">
                {activeChat ? activeChat.username : ''}
              </div>
            </div>
          )}
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
                  aria-label="Start voice call"
                >
                  <span role="img" aria-label="Voice Call">📞</span>
                </button>
                <button
                  className="ml-2 p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  title="Video Call"
                  onClick={() => startCall('video')}
                  aria-label="Start video call"
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
                      className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`max-w-xs px-4 py-2 rounded-2xl shadow-md text-sm transition-all duration-200
                        ${msg.sender._id === user._id
                          ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700'}
                        group-hover:scale-105 group-hover:shadow-lg
                      `}>
                        <div className="break-words whitespace-pre-line">{msg.text}</div>
                        <div className="text-xs text-gray-300 dark:text-gray-400 mt-1 text-right select-none">
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
              {/* Enhanced Video Call Component */}
              {showVideoCall && (
                <>
                  {calling ? (
                    <CallingWindow
                      callType={callType}
                      targetUser={activeChat}
                      onCancel={endCall}
                      stream={stream}
                      callDuration={callDuration}
                      connectionStatus={connectionStatus}
                    />
                  ) : (
                    <VideoCall
                      user={user}
                      activeChat={activeChat}
                      onClose={() => {
                        setShowVideoCall(false);
                        endCall();
                      }}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DM; 