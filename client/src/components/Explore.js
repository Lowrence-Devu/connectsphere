import React, { useState } from 'react';

const Explore = ({ posts, onPostClick, onSearch }) => {
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(search);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6 flex justify-center">
        <input
          type="text"
          className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Search users or hashtags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Search</button>
      </form>
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {posts.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No posts found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try searching for something else.</p>
          </div>
        ) : (
          posts.map(post => (
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
          ))
        )}
      </div>
    </div>
  );
};

export default Explore; 