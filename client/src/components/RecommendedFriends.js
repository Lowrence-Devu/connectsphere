import React, { useEffect, useState } from 'react';

const RecommendedFriends = ({ onFollow }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/users/recommendations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setRecommendations(data);
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

  const handleFollow = async (userId) => {
    setFollowing(f => [...f, userId]);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to follow user');
      setRecommendations(recs => recs.filter(u => u._id !== userId));
      if (onFollow) onFollow(userId);
    } catch (err) {
      setError(err.message);
    } finally {
      setFollowing(f => f.filter(id => id !== userId));
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading recommendations...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!recommendations.length) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 mb-6">
      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">People You May Know</h3>
      <div className="flex flex-col gap-3">
        {recommendations.map(user => (
          <div key={user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <img src={user.profileImage || '/logo192.png'} alt={user.username} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate">{user.username}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.mutualFollowers} mutual {user.mutualFollowers === 1 ? 'follower' : 'followers'}</div>
            </div>
            <button
              className="px-4 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              disabled={following.includes(user._id)}
              onClick={() => handleFollow(user._id)}
            >
              {following.includes(user._id) ? 'Following...' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedFriends; 