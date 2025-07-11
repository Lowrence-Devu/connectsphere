import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Feed from './components/Feed';
import Profile from './components/Profile';
import PostModal from './components/PostModal';
import CreatePostModal from './components/CreatePostModal';
import Explore from './components/Explore';
import DM from './components/DM';
import Header from './components/Header';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';


function App() {
  const socket = useRef(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u && u.id && !u._id) u._id = u.id;
    return u;
  });
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentView, setCurrentView] = useState('feed'); // 'feed', 'profile'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState(JSON.parse(localStorage.getItem('searchHistory') || '[]'));
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'username', // 'username', 'followers', 'recent'
    minFollowers: '',
    maxFollowers: '',
    hasPosts: false
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // user object
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  // Add state for editing profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editProfileImage, setEditProfileImage] = useState(user?.profileImage || '');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState('');
  const [explorePosts, setExplorePosts] = useState([]);

  useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    // Initialize dark mode on mount
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    if (token) {
      // Initialize Socket.IO connection
      socket.current = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');
      
      socket.current.on('connect', () => {
        console.log('Connected to server');
        if (user?._id) {
          socket.current.emit('join', user._id);
        }
      });
      
      socket.current.on('newPost', (post) => {
        setPosts(prev => [post, ...prev]);
      });
      
      socket.current.on('postLiked', (data) => {
        setPosts(prev => prev.map(post => 
          post._id === data.postId 
            ? { ...post, likes: data.likes }
            : post
        ));
      });
      
      socket.current.on('newComment', (data) => {
        setComments(prev => ({
          ...prev,
          [data.postId]: [...(prev[data.postId] || []), data.comment]
        }));
      });

      // Listen for real-time notifications
      socket.current.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      
      return () => {
        if (socket.current) socket.current.disconnect();
      };
    }
  }, [token, user?._id]);

  // Fetch inbox on login
  useEffect(() => {
    if (token) {
      fetchInbox();
    }
  }, [token]);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setInbox(data);
    } catch (err) {
      setInbox([]);
    }
  };

  // Fetch conversation when activeChat changes
  useEffect(() => {
    if (activeChat && token) {
      fetchConversation(activeChat._id);
    }
  }, [activeChat, token]);

  const fetchConversation = async (userId) => {
    setChatLoading(true);
    try {
      const res = await fetch(`${API_URL}/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setMessages([]);
    }
    setChatLoading(false);
  };

  // Real-time messaging
  useEffect(() => {
    if (token && user?._id) {
      if (!socket.current) return;
      socket.current.on('receive_message', (msg) => {
        if (
          (activeChat && msg.sender._id === activeChat._id) ||
          (activeChat && msg.sender._id === user._id && msg.receiver === activeChat._id)
        ) {
          setMessages(prev => [...prev, msg]);
        }
        // If no chat is open, auto-open chat with sender
        if (!activeChat && msg.sender._id !== user._id) {
          setActiveChat({ _id: msg.sender._id, username: msg.sender.username });
        }
        fetchInbox();
      });
      return () => {
        if (socket.current) socket.current.off('receive_message');
      };
    }
  }, [token, user?._id, activeChat]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChat) return;
    const msg = {
      sender: user._id,
      receiver: activeChat._id,
      text: messageText.trim()
    };
    console.log('Sending message:', msg);
    if (socket.current) {
      socket.current.emit('send_message', msg);
    }
    setMessageText('');
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearch && !event.target.closest('.search-container')) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearch]);

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch(`${API_URL}/posts`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts');
    }
    setPostsLoading(false);
  };

  const fetchComments = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`);
      const data = await res.json();
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error('Failed to fetch comments');
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const params = new URLSearchParams({
        q: query,
        sortBy: filters.sortBy,
        ...(filters.minFollowers && { minFollowers: filters.minFollowers }),
        ...(filters.maxFollowers && { maxFollowers: filters.maxFollowers }),
        ...(filters.hasPosts && { hasPosts: 'true' })
      });
      
      const res = await fetch(`${API_URL}/users/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Failed to search users');
      setSearchResults([]);
    }
    setSearching(false);
  };

  const followUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Update search results
        setSearchResults(prev => prev.map(user => 
          user._id === userId 
            ? { ...user, followers: [...(user.followers || []), user?.id] }
            : user
        ));
        // Update user profile if viewing it
        if (userProfile && userProfile._id === userId) {
          setUserProfile(prev => ({ ...prev, followers: [...(prev.followers || []), user?.id] }));
        }
      }
    } catch (err) {
      console.error('Failed to follow user');
    }
  };

  const unfollowUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/unfollow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Update search results
        setSearchResults(prev => prev.map(user => 
          user._id === userId 
            ? { ...user, followers: user.followers?.filter(id => id !== user?.id) || [] }
            : user
        ));
        // Update user profile if viewing it
        if (userProfile && userProfile._id === userId) {
          setUserProfile(prev => ({ 
            ...prev, 
            followers: prev.followers?.filter(id => id !== user?.id) || [] 
          }));
        }
      }
    } catch (err) {
      console.error('Failed to unfollow user');
    }
  };

  const fetchUserProfile = async (userId) => {
    setProfileLoading(true);
    try {
      // Fetch user profile
      const profileRes = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      setUserProfile(profileData);

      // Fetch user posts
      const postsRes = await fetch(`${API_URL}/posts/user/${userId}`);
      const postsData = await postsRes.json();
      setUserPosts(postsData);
    } catch (err) {
      console.error('Failed to fetch user profile');
    }
    setProfileLoading(false);
  };

  const addToSearchHistory = (query) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const navigateToProfile = (user) => {
    setSelectedUser(user);
    setCurrentView('profile');
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    addToSearchHistory(user.username);
    fetchUserProfile(user._id);
  };

  const goBackToFeed = () => {
    setCurrentView('feed');
    setSelectedUser(null);
    setUserProfile(null);
    setUserPosts([]);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? 'login' : 'register';
      const body = isLogin
        ? { email, password }
        : { username, email, password };
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setError(data.message || 'Auth failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socket.current) socket.current.disconnect();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setUploading(false);
      setSelectedFile(null);
      return data.url;
    } catch (err) {
      setUploading(false);
      setError('Failed to upload image');
      return null;
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let imageUrl = '';
    if (selectedFile) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        setLoading(false);
        return;
      }
    }
    
    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, image: imageUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setText('');
        setImage('');
        setSelectedFile(null);
        // Real-time update handled by socket
      } else {
        setError(data.message || 'Failed to create post');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleLike = async (postId) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Real-time update handled by socket
    } catch (err) {
      console.error('Failed to like post');
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText[postId]?.trim()) return;
    
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText[postId] }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentText(prev => ({ ...prev, [postId]: '' }));
        // Real-time update handled by socket
      }
    } catch (err) {
      console.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh comments
      fetchComments(posts.find(p => comments[p._id]?.some(c => c._id === commentId))?._id);
    } catch (err) {
      console.error('Failed to delete comment');
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!comments[postId]) {
      fetchComments(postId);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Fetch notifications on login
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Optimistic UI update
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // API call
      await fetch(`${API_URL}/notifications/read`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ id: notificationId })
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Helper to open modal
  const openPostModal = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };
  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  const handleCreatePostModal = async ({ caption, imageFile }) => {
    setUploadingPost(true);
    setCreatePostError('');
    let imageUrl = '';
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.message || 'Image upload failed');
        imageUrl = data.url;
      }
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: caption, image: imageUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create post');
      setShowCreatePostModal(false);
      setUploadingPost(false);
      setCreatePostError('');
      fetchPosts();
    } catch (err) {
      setCreatePostError(err.message || 'Failed to create post');
      setUploadingPost(false);
    }
  };

  // Fetch posts for Explore (can be same as feed for now)
  const fetchExplorePosts = async (search = '') => {
    try {
      let url = `${API_URL}/posts`;
      if (search) {
        url += `?q=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setExplorePosts(data);
    } catch (err) {
      setExplorePosts([]);
    }
  };

  // Fetch explore posts on mount or when switching to explore
  useEffect(() => {
    if (currentView === 'explore') {
      fetchExplorePosts();
    }
  }, [currentView]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:scale-105">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">ConnectSphere</h1>
            <p className="text-gray-600 dark:text-gray-300">Connect with friends and share your thoughts</p>
          </div>
          
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Join ConnectSphere'}
          </h2>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ConnectSphere
              </h1>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  className="w-64 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showSearch && (searchQuery.trim() || searchResults.length > 0 || showFilters) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {searching ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-sm">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map(user => (
                          <div
                            key={user._id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <div 
                              className="flex items-center space-x-3 flex-1 cursor-pointer"
                              onClick={() => navigateToProfile(user)}
                            >
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user.username?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-800 dark:text-white">{user.username}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.followers?.length || 0} followers • {user.following?.length || 0} following
                                </div>
                              </div>
                            </div>
                            {user._id !== user?.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isFollowing = user.followers?.includes(user?.id);
                                  if (isFollowing) {
                                    unfollowUser(user._id);
                                  } else {
                                    followUser(user._id);
                                  }
                                }}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                  user.followers?.includes(user?.id)
                                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {user.followers?.includes(user?.id) ? 'Unfollow' : 'Follow'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.trim() && searchQuery.length >= 2 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </div>
                    ) : searchHistory.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Recent Searches
                        </div>
                        {searchHistory.map((query, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => setSearchQuery(query)}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400 dark:text-gray-500">🕒</span>
                              <span className="text-gray-700 dark:text-gray-300">{query}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newHistory = searchHistory.filter((_, i) => i !== index);
                                setSearchHistory(newHistory);
                                localStorage.setItem('searchHistory', JSON.stringify(newHistory));
                              }}
                              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={clearSearchHistory}
                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Clear History
                          </button>
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Advanced Filters Panel */}
                    {showFilters && (
                      <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Advanced Filters</h4>
                          
                          {/* Sort By */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sort by</label>
                            <select
                              value={filters.sortBy}
                              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="username">Username (A-Z)</option>
                              <option value="followers">Most Followers</option>
                              <option value="recent">Recently Joined</option>
                            </select>
                          </div>
                          
                          {/* Follower Count Range */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min followers</label>
                              <input
                                type="number"
                                placeholder="0"
                                value={filters.minFollowers}
                                onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max followers</label>
                              <input
                                type="number"
                                placeholder="∞"
                                value={filters.maxFollowers}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                          
                          {/* Has Posts Filter */}
                          <div className="mb-3">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.hasPosts}
                                onChange={(e) => setFilters(prev => ({ ...prev, hasPosts: e.target.checked }))}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Has posts</span>
                            </label>
                          </div>
                          
                          {/* Apply Filters Button */}
                          <button
                            onClick={() => {
                              if (searchQuery.trim()) {
                                searchUsers(searchQuery);
                              }
                            }}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No notifications
                      </div>
                    ) : (
                      <div className="py-2">
                        {notifications.map(notification => (
                          <div
                            key={notification._id}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer ${
                              !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={() => markAsRead(notification._id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">👤</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  <span className="font-medium">{notification.sender?.username}</span>
                                  {' '}
                                  {notification.type === 'like' && 'liked your post'}
                                  {notification.type === 'comment' && 'commented on your post'}
                                  {notification.type === 'follow' && 'started following you'}
                                  {notification.type === 'mention' && 'mentioned you in a comment'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setCurrentView(currentView === 'profile' ? 'feed' : 'profile')}
                  className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {currentView === 'dm' ? (
          <DM
            inbox={inbox}
            activeChat={activeChat}
            messages={messages}
            onSelectChat={setActiveChat}
            onSendMessage={handleSendMessage}
            messageText={messageText}
            setMessageText={setMessageText}
            user={user}
            chatLoading={chatLoading}
          />
        ) : currentView === 'explore' ? (
          <Explore
            posts={explorePosts}
            onPostClick={openPostModal}
            onSearch={fetchExplorePosts}
          />
        ) : (currentView === 'feed' || currentView === 'profile') && (
          <button
            onClick={() => setShowCreatePostModal(true)}
            className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Create Post"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
          >
            +
          </button>
        )}
        <CreatePostModal
          open={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          onCreate={handleCreatePostModal}
          uploading={uploadingPost}
          error={createPostError}
        />
        {currentView === 'profile' ? (
          <>
            {console.log('Profile debug:', { userProfile, userPosts })}
            <Profile
              userProfile={userProfile}
              userPosts={userPosts}
              user={user}
              editingProfile={editingProfile}
              editUsername={editUsername}
              editBio={editBio}
              editProfileImage={editProfileImage}
              editImageFile={editImageFile}
              editLoading={editLoading}
              editError={editError}
              setEditingProfile={setEditingProfile}
              setEditUsername={setEditUsername}
              setEditBio={setEditBio}
              setEditProfileImage={setEditProfileImage}
              setEditImageFile={setEditImageFile}
              handleEditProfile={async (e) => {
                e.preventDefault();
                setEditLoading(true);
                setEditError('');
                let imageUrl = editProfileImage;
                try {
                  if (editImageFile) {
                    const formData = new FormData();
                    formData.append('image', editImageFile);
                    const res = await fetch(`${API_URL}/upload`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });
                    const data = await res.json();
                    if (!res.ok || !data.url) throw new Error(data.message || 'Image upload failed');
                    imageUrl = data.url;
                  }
                  const res = await fetch(`${API_URL}/users/me`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ username: editUsername, bio: editBio, profileImage: imageUrl })
                  });
                  const updated = await res.json();
                  if (!res.ok) throw new Error(updated.message || 'Profile update failed');
                  setUserProfile(updated);
                  setUser(updated);
                  localStorage.setItem('user', JSON.stringify(updated));
                  setEditingProfile(false);
                } catch (err) {
                  setEditError(err.message || 'Failed to update profile');
                  console.error('Profile update error:', err);
                }
                setEditLoading(false);
              }}
              followUser={followUser}
              unfollowUser={unfollowUser}
              setCurrentView={setCurrentView}
              setActiveChat={setActiveChat}
              onPostClick={openPostModal}
            />
          </>
        ) : currentView === 'feed' ? (
          <Feed
            posts={posts}
            user={user}
            comments={comments}
            showComments={showComments}
            commentText={commentText}
            onLike={handleLike}
            onAddComment={(postId, value) => {
              if (value !== undefined) {
                setCommentText(prev => ({ ...prev, [postId]: value }));
              } else {
                handleAddComment(postId);
              }
            }}
            onDeleteComment={handleDeleteComment}
            onToggleComments={toggleComments}
            onNavigateToProfile={navigateToProfile}
            onPostClick={openPostModal}
          />
        ) : null}
        {showPostModal && selectedPost && (
          <PostModal
            post={selectedPost}
            user={user}
            comments={comments[selectedPost._id] || []}
            onClose={closePostModal}
            onLike={() => handleLike(selectedPost._id)}
            onAddComment={() => handleAddComment(selectedPost._id)}
            onDeleteComment={handleDeleteComment}
            commentText={commentText[selectedPost._id] || ''}
            setCommentText={val => setCommentText(prev => ({ ...prev, [selectedPost._id]: val }))}
          />
        )}
      </div>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center py-2 shadow-lg backdrop-blur-md">
        <button
          className={`flex flex-col items-center px-4 py-1 focus:outline-none ${currentView === 'feed' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setCurrentView('feed')}
        >
          <span className="text-xl">🏠</span>
          <span className="text-xs">Feed</span>
        </button>
        <button
          className={`flex flex-col items-center px-4 py-1 focus:outline-none ${currentView === 'explore' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setCurrentView('explore')}
        >
          <span className="text-xl">🔍</span>
          <span className="text-xs">Explore</span>
        </button>
        <button
          className={`flex flex-col items-center px-4 py-1 focus:outline-none ${currentView === 'dm' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setCurrentView('dm')}
        >
          <span className="text-xl">💬</span>
          <span className="text-xs">Messages</span>
        </button>
        <button
          className={`flex flex-col items-center px-4 py-1 focus:outline-none ${currentView === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => {
            setCurrentView('profile');
            if (user && user._id) {
              setUserProfile(user);
              fetchUserProfile(user._id);
            }
          }}
        >
          <span className="text-xl">👤</span>
          <span className="text-xs">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
