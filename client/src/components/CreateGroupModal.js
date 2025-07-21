import React, { useState } from 'react';

const CreateGroupModal = ({ onClose, onCreate, creating, error }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberInputs, setMemberInputs] = useState(['']);
  const [memberSuggestions, setMemberSuggestions] = useState([[]]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch user suggestions for a given input
  const fetchUserSuggestions = async (value, idx) => {
    if (!value.trim() || value.length < 2) {
      setMemberSuggestions(suggestions => suggestions.map((s, i) => i === idx ? [] : s));
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setMemberSuggestions(suggestions => suggestions.map((s, i) => i === idx ? data.users : s));
    } catch (err) {
      setMemberSuggestions(suggestions => suggestions.map((s, i) => i === idx ? [] : s));
    }
    setSearching(false);
  };

  const handleMemberInputChange = (idx, value) => {
    setMemberInputs(inputs => inputs.map((m, i) => i === idx ? value : m));
    fetchUserSuggestions(value, idx);
  };

  const handleAddMemberInput = () => {
    setMemberInputs([...memberInputs, '']);
    setMemberSuggestions([...memberSuggestions, []]);
  };

  const handleRemoveMemberInput = idx => {
    setMemberInputs(memberInputs.filter((_, i) => i !== idx));
    setMemberSuggestions(memberSuggestions.filter((_, i) => i !== idx));
  };

  const handleSelectSuggestion = (idx, user) => {
    if (!selectedMembers.some(m => m._id === user._id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
    setMemberInputs(inputs => inputs.map((m, i) => i === idx ? '' : m));
    setMemberSuggestions(suggestions => suggestions.map((s, i) => i === idx ? [] : s));
  };

  const handleRemoveSelectedMember = userId => {
    setSelectedMembers(selectedMembers.filter(m => m._id !== userId));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!name.trim()) return;
    const memberIds = selectedMembers.map(m => m._id);
    onCreate({ name, description, members: memberIds });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Create Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <input
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Group name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <textarea
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add members (username or email)</label>
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedMembers.map(user => (
                  <span key={user._id} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                    {user.username} <button type="button" className="ml-1 text-red-500" onClick={() => handleRemoveSelectedMember(user._id)} title="Remove">✕</button>
                  </span>
                ))}
              </div>
            )}
            {memberInputs.map((m, idx) => (
              <div key={idx} className="relative mb-2">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Type username or email..."
                  value={m}
                  onChange={e => handleMemberInputChange(idx, e.target.value)}
                  autoComplete="off"
                />
                {searching && memberInputs[idx] && (
                  <div className="absolute right-2 top-2 text-xs text-gray-400">Searching...</div>
                )}
                {memberSuggestions[idx] && memberSuggestions[idx].length > 0 && (
                  <ul className="absolute left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 mt-1 max-h-40 overflow-y-auto">
                    {memberSuggestions[idx].map(user => (
                      <li
                        key={user._id}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        onClick={() => handleSelectSuggestion(idx, user)}
                      >
                        <span className="font-medium">{user.username}</span> <span className="text-xs text-gray-400">{user.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {memberInputs.length > 1 && (
                  <button type="button" className="absolute right-2 top-2 text-red-500" onClick={() => handleRemoveMemberInput(idx)} title="Remove">✕</button>
                )}
              </div>
            ))}
            <button type="button" className="text-blue-600 hover:underline text-sm" onClick={handleAddMemberInput}>+ Add another</button>
          </div>
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={creating || !name.trim()}
          >
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal; 