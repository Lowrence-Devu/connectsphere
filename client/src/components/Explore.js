import React, { useState, useEffect } from 'react';

const Explore = ({ posts, onPostClick, onSearch, searchUsers, searchResults, showSearch, setShowSearch, navigateToProfile }) => {
  console.log('Explore component rendered with props:', {
    postsLength: posts?.length,
    searchResultsLength: searchResults?.length,
    showSearch,
    navigateToProfile: !!navigateToProfile
  });
  
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [navigatingToUser, setNavigatingToUser] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(search);
  };

  const handleSearchInput = async (e) => {
    const value = e.target.value;
    setSearch(value);
    
    console.log('Search input changed:', value);
    console.log('Current searchResults:', searchResults);
    console.log('Current showSearch:', showSearch);
    
    if (value.trim().length >= 2) {
      setShowSearch(true);
      setSearching(true);
      console.log('Starting search for:', value);
      try {
        await searchUsers(value);
        console.log('Search completed, results:', searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    } else {
      setShowSearch(false);
      setSearching(false);
    }
  };

  const handleUserSelect = async (user) => {
    console.log('User selected from search:', user);
    console.log('navigateToProfile function exists:', !!navigateToProfile);
    setNavigatingToUser(user._id);
    setSearch('');
    setShowSearch(false);
    
    if (navigateToProfile) {
      try {
        // Add visual feedback
        const userCard = document.querySelector(`[data-user-id="${user._id}"]`);
        if (userCard) {
          userCard.style.transform = 'scale(0.95)';
          userCard.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          setTimeout(() => {
            userCard.style.transform = '';
            userCard.style.backgroundColor = '';
          }, 200);
        }
        
        console.log('Calling navigateToProfile with user:', user);
        await navigateToProfile(user);
        console.log('navigateToProfile completed successfully');
      } catch (error) {
        console.error('Error navigating to profile:', error);
        setShowSearch(true); // Reopen search if navigation fails
      } finally {
        setNavigatingToUser(null);
      }
    } else {
      console.error('navigateToProfile function not provided');
      setNavigatingToUser(null);
    }
  };

  console.log('About to render Explore component');
  
  return (
    <div className="w-full">
      {/* Responsive Search Bar */}
      {navigateToProfile && (
        <div className="w-full max-w-xl mx-auto mt-6 mb-8 px-2">
          <form onSubmit={e => e.preventDefault()} className="relative">
            <div className={`flex items-center bg-white dark:bg-gray-900 rounded-3xl shadow-md border-2 transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-lg px-4 py-2 ${searchFocused ? 'scale-105 border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
              >
              <span className="mr-3 text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={handleSearchInput}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search users..."
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base px-1 py-2"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setShowSearch(false);
                  }}
                  className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
          {/* User Results Dropdown */}
          {showSearch && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
              {searchResults.length === 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No users found.</div>
              )}
              {searchResults.map(user => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                  onMouseDown={e => {
                    e.preventDefault();
                    console.log('User clicked in dropdown:', user);
                    setSearch('');
                    setShowSearch(false);
                    navigateToProfile(user);
                  }}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSearch('');
                      setShowSearch(false);
                      navigateToProfile(user);
                    }
                  }}
                  aria-label={`View ${user.username}'s profile`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{user.username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                  </div>
                  <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">View</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instagram-style 3 Column Grid */}
      <div className="grid grid-cols-3 gap-1">
        {posts.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No posts found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Try searching for something else or check back later.</p>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-md">
              Refresh
            </button>
          </div>
        ) : (
          posts.map((post, idx) => (
            <div
              key={post._id}
              className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => onPostClick && onPostClick(post)}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPostClick && onPostClick(post); } }}
              role="button"
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt="Post"
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110 bg-gray-200 dark:bg-gray-700"
                  onError={e => { e.target.src = '/logo192.png'; }}
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Enhanced Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
                <div className="w-full">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium">{post.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info Overlay */}
              {post.user && (
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {post.user.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-white text-xs font-medium">{post.user.username}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
};

export default Explore; 