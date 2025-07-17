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

  // Edit Profile modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
    imageFile: null,
    isPrivate: user?.isPrivate || false,
  });
  const [editProfileLoading, setEditProfileLoading] = useState(false);

  React.useEffect(() => {
    setEditForm({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      profileImage: user?.profileImage || '',
      imageFile: null,
      isPrivate: user?.isPrivate || false,
    });
  }, [user]);

  const handleEditFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setEditForm(f => ({ ...f, [name]: checked }));
    } else if (type === 'file') {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        setEditForm(f => ({ ...f, imageFile: file, profileImage: URL.createObjectURL(file) }));
      }
    } else {
      setEditForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setEditProfileLoading(true);
    try {
      let imageUrl = editForm.profileImage;
      if (editForm.imageFile) {
        const formData = new FormData();
        formData.append('image', editForm.imageFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.message || 'Image upload failed');
        imageUrl = data.url;
      }
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          username: editForm.username,
          email: editForm.email,
          bio: editForm.bio,
          profileImage: imageUrl,
          isPrivate: editForm.isPrivate,
        }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      toast.success('Profile updated');
      setShowEditProfile(false);
      window.location.reload(); // For real-time update
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setEditProfileLoading(false);
    }
  };

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
        <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 overflow-hidden border-2 border-gray-300 dark:border-gray-700 mb-4 relative group">
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
          {userProfile._id === user?._id && (
            <button
              className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              title="Edit Profile"
              onClick={() => setShowEditProfile(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
            </button>
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
                  setShowEditProfile(true);
                  setEditForm({
                    username: user?.username || '',
                    email: user?.email || '',
                    bio: user?.bio || '',
                    profileImage: user?.profileImage || '',
                    imageFile: null,
                    isPrivate: user?.isPrivate || false,
                  });
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71-.505-.781-.929l-.149-.894z" />
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
      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300">
          <form
            onSubmit={handleEditProfileSubmit}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 transform transition-all duration-300 scale-95 opacity-0 animate-modal-in"
            style={{ maxWidth: 400 }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Edit Profile</h2>
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <img
                  src={editForm.profileImage || '/default-avatar.png'}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-all duration-200">
                  <input
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditFormChange}
                  />
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                </label>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input
              type="text"
              name="username"
              value={editForm.username}
              onChange={handleEditFormChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              minLength={3}
              maxLength={20}
            />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              value={editForm.email}
              onChange={handleEditFormChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea
              name="bio"
              value={editForm.bio}
              onChange={handleEditFormChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              maxLength={160}
            />
            <label className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium mb-1">
              <input
                type="checkbox"
                name="isPrivate"
                checked={editForm.isPrivate}
                onChange={handleEditFormChange}
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-400"
              />
              Private Account
            </label>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={editProfileLoading}
              >
                {editProfileLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200"
                onClick={() => setShowEditProfile(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
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