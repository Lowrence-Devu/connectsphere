
import React, { useEffect, useState } from 'react';
import Post from '../Post';

const RecommendedPosts = ({ onPostClick, user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/posts/recommendations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setPosts(data);
        } else {
          const text = await res.text();
          throw new Error('Unexpected response: ' + text);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading recommended posts...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!posts.length) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 mb-6">
      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Recommended Posts</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {posts.map(post => (
          <div key={post._id} className="min-w-[220px] max-w-[220px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col items-center">
            {post.image && (
              <img src={post.image} alt="Post" className="w-full h-40 object-cover" />
            )}
            <div className="flex-1 w-full p-2 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1">
                <img src={post.author?.profileImage || '/logo192.png'} alt={post.author?.username} className="w-7 h-7 rounded-full object-cover bg-gray-200" />
                <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">{post.author?.username || 'Unknown'}</span>
              </div>
              <button
                className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                onClick={() => onPostClick && onPostClick(post)}
              >
                View Post
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
};

export default RecommendedPosts; 