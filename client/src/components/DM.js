import React from 'react';

const DM = ({
  inbox = [],
  activeChat,
  messages = [],
  onSelectChat,
  onSendMessage,
  messageText,
  setMessageText,
  user,
  chatLoading
}) => {
  return (
    <div className="flex h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Sidebar: Inbox */}
      <div className="w-1/3 min-w-[180px] max-w-xs border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
        <div className="p-4 font-bold text-lg text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">Inbox</div>
        {inbox.length === 0 ? (
          <div className="p-4 text-gray-400 dark:text-gray-500 text-center">No conversations yet.</div>
        ) : (
          inbox.map(conv => (
            <div
              key={conv.user._id || conv.user}
              className={`flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 ${activeChat && conv.user._id === activeChat._id ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
              onClick={() => onSelectChat(conv.user)}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {conv.user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 dark:text-white truncate">{conv.user.username}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage?.text || 'No messages yet.'}</div>
              </div>
              {conv.unread > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">{conv.unread}</span>
              )}
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
              <div className="font-bold text-gray-800 dark:text-white">{activeChat.username}</div>
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