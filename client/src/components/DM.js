import React, { useState, useEffect, useRef } from 'react';
import { useVideoCall } from '../hooks/useVideoCall';
import VideoCall from './VideoCall';
import GroupList from './GroupList';
import CreateGroupModal from './CreateGroupModal';
import GroupChat from './GroupChat';

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
  const [mobileView, setMobileView] = useState('inbox'); // 'inbox' | 'chat'

  // Detect mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle browser back on mobile
  useEffect(() => {
    if (!isMobile) return;
    const onPopState = (e) => {
      if (mobileView === 'chat') {
        setMobileView('inbox');
        window.history.pushState({}, '');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isMobile, mobileView]);

  // When a chat is selected on mobile, switch to chat view
  const handleSelectChat = (chatUser) => {
    onSelectChat(chatUser);
    if (isMobile) {
      setMobileView('chat');
      window.history.pushState({}, '');
    }
  };

  // When activeChat changes, auto-switch to chat view on mobile
  useEffect(() => {
    if (isMobile && activeChat) setMobileView('chat');
  }, [isMobile, activeChat]);

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

  useEffect(() => {
    console.log('Inbox data:', inbox);
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

  // Layout
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);
  const [groups, setGroups] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async ({ name, description, members }) => {
    setCreatingGroup(true);
    setCreateGroupError('');
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, description, members })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create group');
      }
      await fetchGroups();
      setShowCreateGroupModal(false);
    } catch (err) {
      setCreateGroupError(err.message);
    }
    setCreatingGroup(false);
  };

  const fetchGroupMessages = async (groupId) => {
    setLoadingGroupMessages(true);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setGroupMessages(data);
    } catch (err) {
      setGroupMessages([]);
    }
    setLoadingGroupMessages(false);
  };

  const handleSendGroupMessage = async (text) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`${API_URL}/groups/${selectedGroup._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        fetchGroupMessages(selectedGroup._id);
      }
    } catch (err) {
      // Optionally show error
    }
  };

  const fetchGroupInfo = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSelectedGroup(data);
    } catch (err) {}
  };

  // Inline InboxSidebar and ChatArea for mobile
  function InboxSidebar() {
    return (
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 p-0 md:p-4">
        {/* Inbox Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-300">Inbox</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 max-h-56 overflow-y-auto">
            {inbox.length === 0 ? (
              <div className="text-gray-400 text-center py-6">No conversations yet</div>
            ) : (
              inbox.map((chat, idx) => {
                const chatUser = chat.user;
                return (
                  <div
                    key={chatUser._id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 shadow-sm mb-1 hover:bg-blue-50 dark:hover:bg-gray-700"
                    onClick={() => {
                      setSelectedGroup(null);
                      handleSelectChat(chatUser);
                      setMobileView('chat');
                    }}
                  >
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg shadow">
                      {chatUser.username ? chatUser.username[0].toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold text-gray-800 dark:text-white">{chatUser.username}</div>
                      <div className="truncate text-xs text-gray-400">{chat.lastMessage && chat.lastMessage.text ? chat.lastMessage.text : 'No messages yet'}</div>
                    </div>
                    {chat.unread > 0 && (
                      <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Unread" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-2 mt-4">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-300">Groups</span>
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-all duration-200 shadow"
              onClick={() => setShowCreateGroupModal(true)}
            >
              + Create Group
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 max-h-56 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="text-gray-400 text-center py-6">No groups yet</div>
            ) : (
              groups.map(group => (
                <div
                  key={group._id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 shadow-sm mb-1 hover:bg-blue-50 dark:hover:bg-gray-700"
                  onClick={() => {
                    setSelectedGroup(group);
                    fetchGroupMessages(group._id);
                    setMobileView('chat');
                  }}
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg shadow">
                    {group.name ? group.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold text-gray-800 dark:text-white">{group.name}</div>
                    <div className="text-xs text-gray-400">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  function ChatArea() {
    return (
      <div className="flex-1 flex flex-col h-full relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 transition-colors duration-700">
        {/* Back button */}
        <button
          className="m-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition w-10 h-10 flex items-center justify-center"
          onClick={() => setMobileView('inbox')}
          aria-label="Back to inbox"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        {selectedGroup && (
          <GroupChat
            group={selectedGroup}
            messages={groupMessages}
            onSendMessage={text => {
              setGroupMessages(prev => [
                ...prev,
                {
                  _id: `optimistic-${Date.now()}`,
                  text,
                  sender: user,
                  createdAt: new Date().toISOString(),
                },
              ]);
              handleSendGroupMessage(text);
            }}
            user={user}
            loading={loadingGroupMessages}
            onBack={() => setMobileView('inbox')}
            refreshGroup={() => fetchGroupInfo(selectedGroup._id)}
            setSelectedGroup={setSelectedGroup}
          />
        )}
        {/* Only show direct message chat if no group is selected */}
        {!selectedGroup && (
          <>
            {/* Chat Header */}
            {activeChat && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg shadow-sm">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-xl shadow">
                  {activeChat.username ? activeChat.username[0].toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-bold text-lg text-white">{activeChat.username}</div>
                </div>
              </div>
            )}
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-2 space-y-3 px-2 md:px-4 py-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 transition-all duration-300 rounded-b-lg">
              {chatLoading ? (
                <div className="text-gray-500 dark:text-gray-400 text-center">Loading messages...</div>
              ) : (!messages || messages.length === 0) ? (
                <div className="text-gray-400 dark:text-gray-500 text-center">No messages yet. Say hi!</div>
              ) : (
                messages.map((msg, idx) => {
                  const isSender = msg.sender && (msg.sender._id === user._id || msg.sender === user._id);
                  return (
                    <div key={msg._id || idx} className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                      {!isSender && (
                        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold text-base shadow">
                          {activeChat.username ? activeChat.username[0].toUpperCase() : '?'}
                        </div>
                      )}
                      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow text-sm transition-all duration-200 ${isSender ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'} border border-gray-200 dark:border-gray-700`}>
                        <div className="font-semibold mb-1 text-xs text-blue-500 dark:text-blue-300">{isSender ? 'You' : activeChat.username}</div>
                        <div>{msg.text}</div>
                        <div className="text-xs text-gray-400 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </div>
                      {isSender && (
                        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold text-base shadow">
                          {user.username ? user.username[0].toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Message Input */}
            {activeChat && (
              <form
                className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-lg shadow-md"
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                  disabled={!messageText.trim()}
                >
                  Send
                </button>
              </form>
            )}
          </>
        )}
      </div>
    );
  }

  // Main render
  if (isMobile) {
    if (mobileView === 'inbox') {
      return <InboxSidebar />;
    } else if (mobileView === 'chat') {
      return <ChatArea />;
    }
  }
  // Desktop layout
  return (
    <div className="relative w-full">
      <div className="flex h-[70vh] md:h-[80vh] w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 flex-row">
        {/* Sidebar */}
        <div className="w-1/3 h-full flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 p-0 md:p-4">
          {/* Inbox Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-300">Inbox</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 max-h-56 overflow-y-auto">
              {inbox.length === 0 ? (
                <div className="text-gray-400 text-center py-6">No conversations yet</div>
              ) : (
                inbox.map((chat, idx) => {
                  const chatUser = chat.user;
                  return (
                    <div
                      key={chatUser._id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 shadow-sm mb-1 hover:bg-blue-50 dark:hover:bg-gray-700"
                      onClick={() => {
                        setSelectedGroup(null);
                        handleSelectChat(chatUser);
                        if (isMobile) setMobileView('chat');
                      }}
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg shadow">
                        {chatUser.username ? chatUser.username[0].toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-semibold text-gray-800 dark:text-white">{chatUser.username}</div>
                        <div className="truncate text-xs text-gray-400">{chat.lastMessage && chat.lastMessage.text ? chat.lastMessage.text : 'No messages yet'}</div>
                      </div>
                      {chat.unread > 0 && (
                        <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Unread" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {/* Groups Section */}
          <div>
            <div className="flex items-center justify-between mb-2 mt-4">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-300">Groups</span>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-all duration-200 shadow"
                onClick={() => setShowCreateGroupModal(true)}
              >
                + Create Group
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 max-h-56 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="text-gray-400 text-center py-6">No groups yet</div>
              ) : (
                groups.map(group => {
                  const isSelected = selectedGroup && selectedGroup._id === group._id;
                  return (
                    <div
                      key={group._id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 shadow-sm mb-1 hover:bg-blue-50 dark:hover:bg-gray-700"
                      onClick={() => {
                        setSelectedGroup(group);
                        fetchGroupMessages(group._id);
                        if (isMobile) setMobileView('chat');
                      }}
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg shadow">
                        {group.name ? group.name[0].toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-semibold text-gray-800 dark:text-white">{group.name}</div>
                        <div className="text-xs text-gray-400">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-full relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 transition-colors duration-700">
          {selectedGroup && (
            <GroupChat
              group={selectedGroup}
              messages={groupMessages}
              onSendMessage={text => {
                setGroupMessages(prev => [
                  ...prev,
                  {
                    _id: `optimistic-${Date.now()}`,
                    text,
                    sender: user,
                    createdAt: new Date().toISOString(),
                  },
                ]);
                handleSendGroupMessage(text);
              }}
              user={user}
              loading={loadingGroupMessages}
              onBack={() => setSelectedGroup(null)}
              refreshGroup={() => fetchGroupInfo(selectedGroup._id)}
              setSelectedGroup={setSelectedGroup}
            />
          )}
          {/* Only show direct message chat if no group is selected */}
          {!selectedGroup && (
            <>
              {/* Chat Header */}
              {activeChat && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg shadow-sm">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-xl shadow">
                    {activeChat.username ? activeChat.username[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-bold text-lg text-white">{activeChat.username}</div>
                  </div>
                </div>
              )}
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-2 space-y-3 px-2 md:px-4 py-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 transition-all duration-300 rounded-b-lg">
                {chatLoading ? (
                  <div className="text-gray-500 dark:text-gray-400 text-center">Loading messages...</div>
                ) : (!messages || messages.length === 0) ? (
                  <div className="text-gray-400 dark:text-gray-500 text-center">No messages yet. Say hi!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSender = msg.sender && (msg.sender._id === user._id || msg.sender === user._id);
                    return (
                      <div key={msg._id || idx} className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        {!isSender && (
                          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold text-base shadow">
                            {activeChat.username ? activeChat.username[0].toUpperCase() : '?'}
                          </div>
                        )}
                        <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow text-sm transition-all duration-200 ${isSender ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'} border border-gray-200 dark:border-gray-700`}>
                          <div className="font-semibold mb-1 text-xs text-blue-500 dark:text-blue-300">{isSender ? 'You' : activeChat.username}</div>
                          <div>{msg.text}</div>
                          <div className="text-xs text-gray-400 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                        </div>
                        {isSender && (
                          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold text-base shadow">
                            {user.username ? user.username[0].toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Message Input */}
              {activeChat && (
                <form
                  className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-lg shadow-md"
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                    disabled={!messageText.trim()}
                  >
                    Send
                  </button>
                </form>
              )}
            </>
          )}
        </div>
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
      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} onCreate={handleCreateGroup} creating={creatingGroup} error={createGroupError} />
      )}
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