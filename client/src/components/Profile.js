import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Post from '../Post';

const settingsOptions = [
  'Apps and websites',
  'QR code',
  'Notifications',
  'Settings and privacy',
  'Supervision',
  'Login activity',
  'Log out',
  'Cancel',
];

const Profile = ({
  userProfile,
  userPosts,
  user,
  editingProfile,
  editUsername,
  editBio,
  editProfileImage,
  editImageFile,
  editLoading,
  editError,
  setEditingProfile,
  setEditUsername,
  setEditBio,
  setEditProfileImage,
  setEditImageFile,
  handleEditProfile,
  followUser,
  unfollowUser,
  setCurrentView,
  setActiveChat,
  onPostClick
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [posts, setPosts] = useState(userPosts);
  // Settings state
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: user?.notificationSettings?.pushEnabled ?? true,
    likes: user?.notificationSettings?.likes ?? true,
    comments: user?.notificationSettings?.comments ?? true,
    follows: user?.notificationSettings?.follows ?? true,
    messages: user?.notificationSettings?.messages ?? true,
    videoCalls: user?.notificationSettings?.videoCalls ?? true,
  });

  // Sync settings when user changes
  React.useEffect(() => {
    setIsPrivate(user?.isPrivate || false);
    setNotificationSettings({
      pushEnabled: user?.notificationSettings?.pushEnabled ?? true,
      likes: user?.notificationSettings?.likes ?? true,
      comments: user?.notificationSettings?.comments ?? true,
      follows: user?.notificationSettings?.follows ?? true,
      messages: user?.notificationSettings?.messages ?? true,
      videoCalls: user?.notificationSettings?.videoCalls ?? true,
    });
  }, [user]);

  if (!userProfile) return null;

  const handleDeletePost = async (postId) => {
    // Optimistically remove the post
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
      toast.success('Post deleted');
    } catch (err) {
      toast.error('Failed to delete post');
      // Optionally, re-add the post if deletion failed
    }
  };
  return (
    <div className="max-w-xl mx-auto space-y-8 px-2 sm:px-0">
      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 flex flex-col items-center transition-all duration-500 animate-fade-in">
        <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 overflow-hidden border-2 border-gray-300 dark:border-gray-700 mb-4">
          {userProfile.profileImage ? (
            <img
              src={userProfile.profileImage}
              alt="Avatar"
              className="w-28 h-28 rounded-full object-cover"
            />
          ) : (
            <span className="text-gray-600 dark:text-gray-200 font-bold text-4xl">
              {userProfile.username?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{userProfile.username}</h2>
        <div className="flex items-center gap-6 text-base text-gray-500 dark:text-gray-400 font-medium mb-2">
          <span><span className="font-bold text-gray-900 dark:text-white">{userPosts.length}</span> posts</span>
          <span><span className="font-bold text-gray-900 dark:text-white">{userProfile.followers?.length || 0}</span> followers</span>
          <span><span className="font-bold text-gray-900 dark:text-white">{userProfile.following?.length || 0}</span> following</span>
        </div>
        <div className="text-gray-600 dark:text-gray-300 text-center mb-4 max-w-xs break-words">{userProfile.bio}</div>
        {/* Action Buttons */}
        <div className="flex gap-3 w-full justify-center mt-2">
          {userProfile._id === user?._id ? (
            <>
              <button
                onClick={() => {
                  setEditingProfile(true);
                  setEditUsername(userProfile.username);
                  setEditBio(userProfile.bio || '');
                  setEditProfileImage(userProfile.profileImage || '');
                  setEditImageFile(null);
                }}
                className="px-5 py-2 rounded-lg font-medium bg-gray-800 text-white hover:bg-gray-700 transition-all duration-200 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-all duration-200 transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                title="Settings"
              >
                <svg className="w-6 h-6 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.774-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.149-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  const isFollowing = userProfile.followers?.includes(user?._id);
                  if (isFollowing) {
                    unfollowUser(userProfile._id);
                  } else {
                    followUser(userProfile._id);
                  }
                }}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${userProfile.followers?.includes(user?._id) ? 'bg-gray-800 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {userProfile.followers?.includes(user?._id) ? 'Unfollow' : 'Follow'}
              </button>
              <button
                onClick={() => {
                  setCurrentView('dm');
                  setActiveChat({ _id: userProfile._id, username: userProfile.username });
                }}
                className="px-5 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-all duration-200 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                Message
              </button>
              <button
                onClick={() => {
                  // Video call functionality will be added here
                  console.log('Video call to:', userProfile.username);
                }}
                className="px-5 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                📞 Call
              </button>
            </>
          )}
        </div>
      </div>
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-96 max-w-full p-6 flex flex-col gap-4 transform transition-all duration-300 scale-95 opacity-0 animate-modal-in">
            <h2 className="text-xl font-bold text-white mb-2">Settings</h2>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setSettingsLoading(true);
                try {
                  const res = await fetch('/api/users/me', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                      isPrivate,
                      notificationSettings,
                    }),
                  });
                  if (!res.ok) throw new Error('Failed to update settings');
                  toast.success('Settings updated');
                  setShowSettings(false);
                } catch (err) {
                  toast.error(err.message || 'Failed to update settings');
                } finally {
                  setSettingsLoading(false);
                }
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="flex items-center gap-3 text-white font-medium mb-1">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-400"
                  />
                  Private Account
                </label>
                <p className="text-gray-400 text-xs ml-8">Only approved followers can see your posts.</p>
              </div>
              <div className="border-t border-gray-700 pt-2">
                <div className="font-semibold text-white mb-2">Notifications</div>
                {[
                  { key: 'pushEnabled', label: 'Enable Push Notifications' },
                  { key: 'likes', label: 'Likes' },
                  { key: 'comments', label: 'Comments' },
                  { key: 'follows', label: 'Follows' },
                  { key: 'messages', label: 'Messages' },
                  { key: 'videoCalls', label: 'Video Calls' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-3 text-white mb-1">
                    <input
                      type="checkbox"
                      checked={!!notificationSettings[opt.key]}
                      onChange={e => setNotificationSettings(ns => ({ ...ns, [opt.key]: e.target.checked }))}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-400"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
            <button
              className="w-full mt-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      )}
      {/* User Posts Grid */}
      <div className="transition-all duration-500 animate-fade-in">
        {userPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400">This user hasn't shared anything yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {posts.map(post => (
              <Post
                key={post._id}
                post={post}
                user={user}
                onPostClick={onPostClick}
                onDeletePost={handleDeletePost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 