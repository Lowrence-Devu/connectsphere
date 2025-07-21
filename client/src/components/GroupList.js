import React from 'react';

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const GroupList = ({ groups, onSelectGroup, onCreateGroup, selectedGroupId }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Groups</h2>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-all duration-200 shadow"
          onClick={onCreateGroup}
        >
          + Create Group
        </button>
      </div>
      {groups.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">No groups yet.</div>
      ) : (
        <ul className="space-y-2">
          {groups.map(group => (
            <li
              key={group._id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 shadow-sm hover:bg-blue-50 dark:hover:bg-gray-800 ${selectedGroupId === group._id ? 'bg-blue-100 dark:bg-blue-800/60 border border-blue-400' : 'bg-gray-50 dark:bg-gray-800 border border-transparent'}`}
              onClick={() => onSelectGroup(group)}
            >
              {group.profileImage ? (
                <img
                  src={group.profileImage.startsWith('http') ? group.profileImage : `${BACKEND_URL}${group.profileImage}`}
                  alt={group.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-blue-400 shadow"
                />
              ) : (
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg shadow">
                  {getInitials(group.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold text-gray-800 dark:text-white">{group.name}</div>
                <div className="text-xs text-gray-400">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupList; 