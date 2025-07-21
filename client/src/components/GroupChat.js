import React, { useState, useRef, useEffect } from 'react';
import GroupInfoModal from './GroupInfoModal';

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

const GroupChat = ({ group, messages, onSendMessage, user, loading, onBack, refreshGroup, setSelectedGroup }) => {
  const [text, setText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const isAdmin = group.admins.some(a => a._id === user._id);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleSend = e => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  // Group management handlers
  const handleRename = async (newName) => {
    setInfoLoading(true);
    setInfoError('');
    try {
      const res = await fetch(`${API_URL}/groups/${group._id}/name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newName })
      });
      const updated = await res.json();
      console.log('Group rename response:', updated);
      if (!res.ok) throw new Error(updated.message || 'Failed to rename group');
      if (setSelectedGroup) setSelectedGroup(updated);
      if (refreshGroup) await refreshGroup();
      setShowInfo(false);
    } catch (err) {
      setInfoError(err.message || 'Failed to rename group');
    }
    setInfoLoading(false);
  };

  const handleAddMember = async (usernameOrEmail) => {
    setInfoLoading(true);
    setInfoError('');
    try {
      const res = await fetch(`${API_URL}/groups/${group._id}/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: usernameOrEmail })
      });
      const updated = await res.json();
      console.log('Group add member response:', updated);
      if (!res.ok) throw new Error(updated.message || 'Failed to add member');
      if (setSelectedGroup) setSelectedGroup(updated);
      if (refreshGroup) await refreshGroup();
      setShowInfo(false);
    } catch (err) {
      setInfoError(err.message || 'Failed to add member');
    }
    setInfoLoading(false);
  };

  const handleRemoveMember = async (memberId) => {
    setInfoLoading(true);
    setInfoError('');
    try {
      const res = await fetch(`${API_URL}/groups/${group._id}/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: memberId })
      });
      if (!res.ok) throw new Error('Failed to remove member');
      const updated = await res.json();
      if (setSelectedGroup) setSelectedGroup(updated);
      if (refreshGroup) await refreshGroup();
      setShowInfo(false);
    } catch (err) {
      setInfoError(err.message || 'Failed to remove member');
    }
    setInfoLoading(false);
  };

  const handleLeave = async () => {
    setInfoLoading(true);
    setInfoError('');
    try {
      const res = await fetch(`${API_URL}/groups/${group._id}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to leave group');
      setShowInfo(false);
      if (onBack) onBack();
    } catch (err) {
      setInfoError(err.message || 'Failed to leave group');
    }
    setInfoLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow p-0 md:p-4 transition-all duration-300">
      {/* Group Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg shadow-sm">
        {onBack && (
          <button
            className="mr-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            onClick={onBack}
            aria-label="Back to chats"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-xl shadow">
          {getInitials(group.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate font-bold text-lg text-white">{group.name}</div>
          <div className="text-xs text-blue-100">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          className="ml-2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
          onClick={() => setShowInfo(true)}
          title="Group Info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4m-4 0H8m4-6a6 6 0 100 12 6 6 0 000-12z" />
          </svg>
        </button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-2 space-y-3 px-2 md:px-4 py-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 transition-all duration-300 rounded-b-lg">
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400 text-center">Loading messages...</div>
        ) : (Array.isArray(messages) ? messages : []).length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 text-center">No messages yet.</div>
        ) : (
          (Array.isArray(messages) ? messages : []).map(msg => {
            const isSender = msg.sender._id === user._id;
            return (
              <div key={msg._id} className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                {!isSender && (
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold text-base shadow">
                    {getInitials(msg.sender.username)}
                  </div>
                )}
                <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow text-sm transition-all duration-200 ${isSender ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'} border border-gray-200 dark:border-gray-700`}>
                  <div className="font-semibold mb-1 text-xs text-blue-500 dark:text-blue-300">{isSender ? 'You' : msg.sender.username}</div>
                  <div>{msg.text}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {isSender && (
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold text-base shadow">
                    {getInitials(user.username)}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Message Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-lg shadow-md">
        <input
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
          disabled={loading || !text.trim()}
        >
          Send
        </button>
      </form>
      {showInfo && (
        <GroupInfoModal
          group={group}
          user={user}
          isAdmin={isAdmin}
          onClose={() => setShowInfo(false)}
          onRename={handleRename}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onLeave={handleLeave}
          loading={infoLoading}
          error={infoError}
          onAvatarUpload={async (updated) => {
            if (setSelectedGroup) setSelectedGroup(updated);
            if (refreshGroup) await refreshGroup();
          }}
        />
      )}
      {infoError && <div className="text-red-500 text-sm text-center mt-2">{infoError}</div>}
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

export default GroupChat; 