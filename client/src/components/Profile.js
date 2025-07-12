import React from 'react';

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
  if (!userProfile) return null;
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden">
            {userProfile.profileImage ? (
              <img
                src={userProfile.profileImage}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {userProfile.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {userProfile.username}
            </h2>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <span>{userPosts.length} posts</span>
              <span>{userProfile.followers?.length || 0} followers</span>
              <span>{userProfile.following?.length || 0} following</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300 mt-2">{userProfile.bio}</div>
          </div>
          {userProfile._id === user?._id ? (
            editingProfile ? (
              <form className="space-y-4 w-full max-w-md" onSubmit={handleEditProfile}>
                <div className="flex flex-col items-center mb-4">
                  <label className="relative cursor-pointer group">
                    <img
                      src={editImageFile ? URL.createObjectURL(editImageFile) : (editProfileImage || '/default-avatar.png')}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setEditImageFile(e.target.files[0])}
                    />
                    <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs rounded-full px-2 py-1 opacity-80 group-hover:opacity-100">Change</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
                    onClick={() => setEditingProfile(false)}
                  >
                    Cancel
                  </button>
                </div>
                {editError && (
                  <div className="text-red-600 dark:text-red-400 text-sm mb-2">{editError}</div>
                )}
              </form>
            ) : (
              <button
                onClick={() => {
                  setEditingProfile(true);
                  setEditUsername(userProfile.username);
                  setEditBio(userProfile.bio || '');
                  setEditProfileImage(userProfile.profileImage || '');
                  setEditImageFile(null);
                }}
                className="px-6 py-2 rounded-full font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )
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
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  userProfile.followers?.includes(user?._id)
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {userProfile.followers?.includes(user?._id) ? 'Unfollow' : 'Follow'}
              </button>
              <button
                onClick={() => {
                  setCurrentView('dm');
                  setActiveChat({ _id: userProfile._id, username: userProfile.username });
                }}
                className="ml-2 px-6 py-2 rounded-full font-medium transition-all duration-200 bg-green-600 text-white hover:bg-green-700"
              >
                Message
              </button>
              <button
                onClick={() => {
                  // Video call functionality will be added here
                  console.log('Video call to:', userProfile.username);
                }}
                className="ml-2 px-6 py-2 rounded-full font-medium transition-all duration-200 bg-purple-600 text-white hover:bg-purple-700"
              >
                📞 Call
              </button>
            </>
          )}
        </div>
      </div>

      {/* User Posts Grid */}
      <div>
        {userPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400">This user hasn't shared anything yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6">
            {userPosts.map(post => (
              <div
                key={post._id}
                className="relative group aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => onPostClick && onPostClick(post)}
              >
                {post.image ? (
                  <img src={post.image} alt="Post" className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                    <span className="text-4xl">📝</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-200">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-semibold text-lg">{post.likes?.length || 0} ♥</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 