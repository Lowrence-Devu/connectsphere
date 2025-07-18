import React, { useState, useEffect, useRef } from 'react';
import { useVideoCall } from '../hooks/useVideoCall';
import VideoCall from './VideoCall';

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
  onNavigateToProfile,
  socket, // <-- pass socket as prop from App.js
  onStartCall // <-- pass onStartCall as prop from App.js
}) => {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const [readMessages, setReadMessages] = useState({});
  
  // Use the enhanced video call hook
  const {
    callActive,
    calling,
    incomingCall,
    call
  } = useVideoCall(user, activeChat);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      // setIsMobile(window.innerWidth < 640); // This line is removed
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Listen for 'typing' events from socket
  useEffect(() => {
    if (!socket || !activeChat) return;
    const handleTyping = (data) => {
      if (data.sender === activeChat._id) {
        setIsTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 1500);
      }
    };
    socket.on('typing', handleTyping);
    return () => {
      socket.off('typing', handleTyping);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [socket, activeChat]);

  // Emit 'typing' event when user types
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (socket && activeChat) {
      socket.emit('typing', { receiver: activeChat._id, sender: user._id });
    }
  };

  // Emit 'message:read' when chat is active and new messages arrive
  useEffect(() => {
    if (!socket || !activeChat || !safeMessages.length) return;
    const lastMsg = safeMessages[safeMessages.length - 1];
    if (lastMsg && lastMsg.sender !== user._id && !lastMsg.readByReceiver) {
      socket.emit('message:read', { messageId: lastMsg._id, sender: lastMsg.sender, receiver: user._id });
    }
  }, [socket, activeChat, safeMessages, user._id]);

  // Listen for 'message:read' events
  useEffect(() => {
    if (!socket) return;
    const handleRead = ({ messageId }) => {
      setReadMessages(prev => ({ ...prev, [messageId]: true }));
    };
    socket.on('message:read', handleRead);
    return () => socket.off('message:read', handleRead);
  }, [socket]);

  return (
    <div className="relative w-full">
      <div className="flex flex-col md:flex-row h-[70vh] md:h-[80vh] w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
        {/* Inbox/Sidebar */}
        <div className="w-full md:w-1/3 h-48 md:h-full border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
          <div className="p-4 font-bold text-lg text-blue-600 dark:text-blue-300 border-b border-gray-200 dark:border-gray-700">Inbox</div>
          <div className="flex-1 overflow-y-auto">
            {inbox.length === 0 ? (
              <div className="text-gray-400 text-center mt-8">No conversations yet</div>
            ) : (
              inbox.map(chat => {
                const chatUser = chat.user ? chat.user : chat;
                return (
                  <div
                    key={chatUser._id}
                    className={`px-4 py-3 cursor-pointer flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-xl mb-1 ${activeChat && activeChat._id === chatUser._id ? 'bg-blue-100 dark:bg-gray-700' : ''}`}
                    onClick={() => onSelectChat(chatUser)}
                  >
                    <img
                      src={chatUser.profileImage || '/default-avatar.png'}
                      alt={typeof (chat.user?.username || chat.username) === 'string' ? (chat.user?.username || chat.username) : 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold text-gray-800 dark:text-white">
                        {
                          typeof (chat.user?.username || chat.username) === 'string'
                            ? (chat.user?.username || chat.username)
                            : (chat.user?._id || chat._id
                                ? `User-${(chat.user?._id || chat._id).slice(0, 6)}`
                                : 'Unknown')
                        }
                        {chat.unread > 0 && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Unread" />
                        )}
                      </div>
                      <div className="truncate text-xs text-gray-500 dark:text-gray-300">{typeof chat.lastMessage === 'string' ? chat.lastMessage : JSON.stringify(chat.lastMessage) || 'No messages yet'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-full relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 transition-colors duration-700">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
            {activeChat && (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={activeChat.profileImage || '/default-avatar.png'}
                    alt={activeChat.username}
                    className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600 shadow-sm"
                  />
                  <div className="font-semibold text-gray-800 dark:text-white text-lg truncate">{activeChat.username}</div>
                </div>
                {/* Call buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    title="Voice Call"
                    onClick={() => onStartCall && onStartCall('voice')}
                    aria-label="Start voice call"
                  >
                    {/* Phone icon (Heroicons outline) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.086c.414 0 .75.336.75.75v2.086c0 .414-.336.75-.75.75H5.25a.75.75 0 00-.75.75v2.25c0 6.075 4.925 11 11 11h2.25a.75.75 0 00.75-.75v-2.086a.75.75 0 01.75-.75h2.086a.75.75 0 01.75.75v2.25c0 1.243-1.007 2.25-2.25 2.25h-2.25C7.798 21.75 2.25 16.202 2.25 9.75v-2.25z" />
                    </svg>
                  </button>
                  <button
                    className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    title="Video Call"
                    onClick={() => onStartCall && onStartCall('video')}
                    aria-label="Start video call"
                  >
                    {/* Video camera icon (Heroicons outline) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6.75A2.25 2.25 0 0013.5 4.5h-3A2.25 2.25 0 008.25 6.75v10.5A2.25 2.25 0 0010.5 19.5h3A2.25 2.25 0 0015.75 17.25v-3.75m0 0l3.5 3.5m-3.5-3.5l-3.5 3.5" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto scroll-smooth px-2 md:px-4 py-3" style={{ minHeight: 0 }}>
            {chatLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <div className="text-lg text-gray-400">Loading messages...</div>
              </div>
            ) : safeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="text-5xl mb-4">💬</div>
                <div className="text-lg text-gray-400">No messages yet. Say hi!</div>
              </div>
            ) : (
              safeMessages.map((msg, idx) => {
                const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                const isSender = String(senderId) === String(user._id);
                const avatarUrl = isSender ? (user.profileImage || '/default-avatar.png') : (activeChat?.profileImage || '/default-avatar.png');
                const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <div
                    key={msg._id || idx}
                    className={`mb-2 flex items-end ${isSender ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  >
                    {/* Receiver avatar */}
                    {!isSender && (
                      <img
                        src={avatarUrl}
                        alt={activeChat?.username || 'User'}
                        className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600 mr-2 shadow-sm"
                      />
                    )}
                    <div>
                      {/* Sender name */}
                      <div className={`text-xs font-bold mb-1 ${isSender ? 'text-blue-500 text-right' : 'text-gray-600 text-left'}`}>{isSender ? 'You' : (activeChat?.username || 'User')}</div>
                      <div className={`relative rounded-2xl px-4 py-2 max-w-xs break-words shadow-md text-base transition-all duration-200 ${isSender ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'} border border-gray-200 dark:border-gray-700`}>
                        {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                        {/* Bubble tail */}
                        <span className={`absolute bottom-0 ${isSender ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} w-3 h-3 ${isSender ? 'bg-blue-500' : 'bg-white dark:bg-gray-700'} rounded-full z-0 border border-gray-200 dark:border-gray-700`}
                          style={{ boxShadow: isSender ? '2px 2px 0 0 #3b82f6' : '-2px 2px 0 0 #e5e7eb' }}
                        />
                      </div>
                      {/* Timestamp and Read Receipt */}
                      <div className={`flex items-center gap-2 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-xs ${isSender ? 'text-blue-400 text-right' : 'text-gray-400 text-left'}`}>{time}</span>
                        {isSender && (msg.readByReceiver || readMessages[msg._id]) && (
                          <span className="text-xs text-green-500 ml-1">✔ Seen</span>
                        )}
                      </div>
                    </div>
                    {/* Sender avatar (optional, usually omitted) */}
                    {isSender && false && (
                      <img
                        src={avatarUrl}
                        alt={user.username || 'You'}
                        className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600 ml-2 shadow-sm"
                      />
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
            {isTyping && activeChat && (
              <div className="text-xs text-blue-400 italic mb-2 animate-fade-in-up flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                {activeChat.username} is typing...
              </div>
            )}
          </div>
          {/* Message Input (sticky on mobile) */}
          {activeChat && (
            <form
              className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0 z-10 shadow-md"
              onSubmit={e => {
                e.preventDefault();
                onSendMessage();
              }}
            >
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                placeholder="Type a message..."
                value={messageText}
                onChange={handleInputChange}
                autoComplete="off"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-md"
                disabled={!messageText.trim()}
              >
                Send
              </button>
            </form>
          )}
        </div>
        {/* Video Call UI (if needed) */}
        {showVideoCall && (
          <VideoCall
            show={showVideoCall}
            onClose={() => setShowVideoCall(false)}
            call={null}
            user={user}
            activeChat={activeChat}
          />
        )}
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

export default DM; 