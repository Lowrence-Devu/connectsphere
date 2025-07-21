import React, { useState, useEffect } from 'react';

// Helper to get initials from a name
function getInitials(name) {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const GroupInfoModal = ({ group, user, isAdmin: isAdminProp, onClose, onRename, onAddMember, onRemoveMember, onLeave, loading, error, onAvatarUpload }) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [addMemberInput, setAddMemberInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(group.profileImage || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Debug log
  useEffect(() => {
    console.log('Group admins:', group.admins);
    console.log('Current user ID:', user._id);
  }, [group.admins, user._id]);

  // Robust admin check
  const isAdmin = Array.isArray(group.admins) && group.admins.some(a => (a._id || a) === user._id);

  useEffect(() => {
    setNewName(group.name);
    setAvatarPreview(group.profileImage || '');
  }, [group.name, group.profileImage]);

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarLoading(true);
    setAvatarError('');
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await fetch(`${API_URL}/groups/${group._id}/avatar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Failed to upload avatar');
      setAvatarFile(null);
      setAvatarPreview(updated.profileImage || '');
      if (onAvatarUpload) onAvatarUpload(updated);
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload avatar');
    }
    setAvatarLoading(false);
  };

  // Autocomplete user search
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!addMemberInput.trim() || addMemberInput.length < 2) {
        setSuggestions([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(addMemberInput)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        // Filter out users already in the group
        const filtered = data.users.filter(u => !group.members.some(m => m._id === u._id));
        setSuggestions(filtered);
      } catch (err) {
        setSuggestions([]);
      }
      setSearching(false);
    };
    fetchSuggestions();
  }, [addMemberInput, group.members]);

  const handleRename = () => {
    if (newName.trim() && newName !== group.name) {
      onRename(newName);
      setEditingName(false);
    }
  };

  const handleAddMember = (userIdOrObj) => {
    let value = userIdOrObj;
    if (typeof userIdOrObj === 'object' && userIdOrObj._id) {
      value = userIdOrObj._id;
    }
    if (value && !group.members.some(m => m._id === value)) {
      onAddMember(value);
      setAddMemberInput('');
      setSuggestions([]);
    }
  };

  const handleAddMemberButton = () => {
    if (suggestions.length > 0) {
      handleAddMember(suggestions[0]);
    } else if (addMemberInput.trim()) {
      handleAddMember(addMemberInput.trim());
    }
  };

  const handleAddMemberInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMemberButton();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Group Info</h2>
        {/* Group Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
          {isAdmin && editingName ? (
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                disabled={loading}
              />
              <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" onClick={handleRename} disabled={loading}>Save</button>
              <button className="text-gray-500 px-2" onClick={() => { setEditingName(false); setNewName(group.name); }}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-white">{group.name}</span>
              {isAdmin && (
                <button className="text-blue-600 hover:underline text-xs" onClick={() => setEditingName(true)}>Edit</button>
              )}
            </div>
          )}
        </div>
        {/* Group Avatar (admin only) */}
        {isAdmin && (
          <div className="mb-4 flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Avatar</label>
            <div className="mb-2">
              {avatarPreview ? (
                <img
                  src={avatarPreview.startsWith('http') ? avatarPreview : `${BACKEND_URL}${avatarPreview}`}
                  alt="Group Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 shadow"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-2xl shadow">
                  {getInitials(group.name)}
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="mb-2"
              disabled={avatarLoading}
            />
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={handleAvatarUpload}
              disabled={avatarLoading || !avatarFile}
              type="button"
            >
              {avatarLoading ? 'Uploading...' : 'Upload Avatar'}
            </button>
            {avatarError && <div className="text-red-500 text-xs mt-1">{avatarError}</div>}
          </div>
        )}
        {/* Members List */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Members</label>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {group.members.map(member => (
              <li key={member._id} className="flex items-center gap-2">
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-xs">
                  {member.username ? member.username[0].toUpperCase() : '?'}
                </div>
                <span className="font-medium text-gray-800 dark:text-white text-sm">{member.username}</span>
                {group.admins.includes(member._id) && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Admin</span>
                )}
                {isAdmin && member._id !== user._id && (
                  <button className="ml-2 text-red-500 text-xs hover:underline" onClick={() => onRemoveMember(member._id)} disabled={loading}>Remove</button>
                )}
                {member._id === user._id && <span className="ml-2 text-xs text-green-500">(You)</span>}
              </li>
            ))}
          </ul>
        </div>
        {/* Add Member (admin only) */}
        {isAdmin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Member (username or email)</label>
            <div className="relative flex gap-2">
              <input
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={addMemberInput}
                onChange={e => setAddMemberInput(e.target.value)}
                onKeyDown={handleAddMemberInputKeyDown}
                disabled={loading}
                autoComplete="off"
                placeholder="Type username or email..."
              />
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handleAddMemberButton}
                disabled={loading || (!addMemberInput.trim() && suggestions.length === 0)}
                type="button"
              >
                Add
              </button>
              {searching && addMemberInput && (
                <div className="absolute right-2 top-2 text-xs text-gray-400">Searching...</div>
              )}
              {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 mt-1 max-h-40 overflow-y-auto">
                  {suggestions.map(u => (
                    <li
                      key={u._id}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      onClick={() => handleAddMember(u)}
                    >
                      <span className="font-medium">{u.username}</span> <span className="text-xs text-gray-400">{u.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {/* Leave Group */}
        <div className="flex justify-end">
          <button className="text-red-600 hover:underline text-sm" onClick={onLeave} disabled={loading}>Leave Group</button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal; 