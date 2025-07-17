import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import Feed from './components/Feed';
import Profile from './components/Profile';
import PostModal from './components/PostModal';
import CreatePostModal from './components/CreatePostModal';
import CreateStoryModal from './components/CreateStoryModal';
import CreateReelModal from './components/CreateReelModal';
import Reels from './components/Reels';
import Explore from './components/Explore';
import DM from './components/DM';
import VideoCall from './components/VideoCall';
import SplashScreen from './components/SplashScreen';
import './components/SplashScreen.css';

// Add debugging for environment variables
console.log('[App] Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  windowLocation: window.location.href
});

// Improved API URL logic for production
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // For production, try to construct the API URL from the current domain
  if (process.env.NODE_ENV === 'production') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // If we're on Vercel, the backend should be on Render
    if (hostname.includes('vercel.app')) {
      return 'https://connectsphere-backend.onrender.com/api';
    }
    
    // For other production deployments
    const baseUrl = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    return `${baseUrl}/api`;
  }
  
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

// Log the final API URL
console.log('[App] Final API URL:', API_URL);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[App] Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The app encountered an error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


function App() {
  const socket = useRef(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u && u.id && !u._id) u._id = u.id;
    return u;
  });
  const [posts, setPosts] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentView, setCurrentView] = useState('feed'); // 'feed', 'profile'
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState(JSON.parse(localStorage.getItem('searchHistory') || '[]'));
  const [showFilters] = useState(false);
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileMenuOption, setProfileMenuOption] = useState(null); // 'account', 'settings', null
  
  // Stories state
  const [stories, setStories] = useState([]);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [createStoryError, setCreateStoryError] = useState('');

  // Reels state
  const [reels, setReels] = useState([]);
  const [showCreateReelModal, setShowCreateReelModal] = useState(false);
  const [uploadingReel, setUploadingReel] = useState(false);
  const [createReelError, setCreateReelError] = useState('');

  // Add hooks for handling Google OAuth redirect
  const location = window.location;
  
  // Add app initialization state
  const [appInitialized, setAppInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Video call state
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [globalIncomingCall, setGlobalIncomingCall] = useState(null);
  const [globalCallActive, setGlobalCallActive] = useState(false);
  const [globalCalling, setGlobalCalling] = useState(false);

  useEffect(() => {
    if (showSplash) return;
    // Initialize app
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing application...');
        // Add a small delay to ensure all state is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        setAppInitialized(true);
        console.log('[App] Application initialized successfully');
      } catch (error) {
        console.error('[App] Initialization error:', error);
        setAppInitialized(true); // Still set to true to prevent infinite loading
      }
    };
    
    initializeApp();
  }, [showSplash]);

  useEffect(() => {
    // Check for token in URL (after Google OAuth)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      setToken(token);
      // Fetch user info from backend with error handling
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return res.json();
          } else {
            const text = await res.text();
            throw new Error(text);
          }
        })
        .then(data => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch(err => {
          setError('Failed to fetch user info');
          console.error('User info fetch error:', err);
          // Remove token from URL
          window.history.replaceState({}, document.title, '/');
        });
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // System preference support for dark mode on first load
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === null) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    if (token) {
      // Enhanced Socket.IO connection with better error handling
      const getSocketUrl = () => {
        const apiUrl = process.env.REACT_APP_API_URL;
        console.log('[App] API URL:', apiUrl);
        
        if (apiUrl) {
          const socketUrl = apiUrl.replace('/api', '');
          console.log('[App] Using socket URL:', socketUrl);
          return socketUrl;
        }
        
        // Fallback for production
        if (window.location.hostname !== 'localhost') {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const socketUrl = `${protocol}//${window.location.hostname}`;
          console.log('[App] Using fallback socket URL:', socketUrl);
          return socketUrl;
        }
        
        console.log('[App] Using localhost fallback');
        return 'http://localhost:5000';
      };
      
      socket.current = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      
      socket.current.on('connect', () => {
        console.log('[App] Connected to server successfully');
        window.socketConnected = true;
        if (user?._id) {
          socket.current.emit('join', user._id);
        }
      });
      
      socket.current.on('connect_error', (error) => {
        console.error('[App] Socket connection error:', error);
        window.socketConnected = false;
      });
      
      socket.current.on('disconnect', (reason) => {
        console.log('[App] Socket disconnected:', reason);
        window.socketConnected = false;
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

  // Global call handling
  useEffect(() => {
    if (token && user?._id && socket.current) {
      socket.current.on('call:incoming', async ({ from, callType }) => {
        console.log('[App] Global incoming call from:', from, 'type:', callType);
        let callerUser = { _id: from, username: 'Unknown' };
        try {
          const res = await fetch(`${API_URL}/users/${from}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            callerUser = data;
          }
        } catch (err) {
          console.error('Failed to fetch caller info:', err);
        }
        setGlobalIncomingCall({ from, callType, callerUser });
        setShowVideoCall(true);
      });

      socket.current.on('call:ended', ({ from }) => {
        console.log('[App] Global call ended by:', from);
        setGlobalIncomingCall(null);
        setGlobalCallActive(false);
        setGlobalCalling(false);
        setShowVideoCall(false);
      });

      return () => {
        if (socket.current) {
          socket.current.off('call:incoming');
          socket.current.off('call:ended');
        }
      };
    }
  }, [token, user?._id]);

  // Handle notification clicks globally
  useEffect(() => {
    const handleNotificationClick = () => {
      if (globalIncomingCall) {
        setShowVideoCall(true);
      }
    };

    window.addEventListener('incomingCallClicked', handleNotificationClick);
    return () => {
      window.removeEventListener('incomingCallClicked', handleNotificationClick);
    };
  }, [globalIncomingCall]);

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
    try {
      console.log('Fetching posts from:', `${API_URL}/posts`);
      const res = await fetch(`${API_URL}/posts`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Posts fetched successfully:', data.length, 'posts');
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts. Please check your connection.');
    }
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

  const navigateToProfile = async (user) => {
    setProfileLoading(true);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    addToSearchHistory(user.username);
    await fetchUserProfile(user._id);
    setCurrentView('profile');
  };

  const goBackToFeed = () => {
    setCurrentView('feed');
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
        setError(data.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Please check your connection and try again.');
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
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
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

  // Stories functions
  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      // Sort stories so user's own stories appear first
      if (user && data.length > 0) {
        const sortedStories = data.sort((a, b) => {
          const aIsUser = a.author._id === user._id;
          const bIsUser = b.author._id === user._id;
          
          if (aIsUser && !bIsUser) return -1;
          if (!aIsUser && bIsUser) return 1;
          return 0;
        });
        setStories(sortedStories);
      } else {
        setStories(data);
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
      setStories([]);
    }
  }, [token, user]);

  const handleCreateStory = async (storyData) => {
    try {
      setUploadingStory(true);
      setCreateStoryError('');

      // Upload media first
      const mediaFormData = new FormData();
      mediaFormData.append('image', storyData.get('media'));
      
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: mediaFormData
      });
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.message || 'Failed to upload media');
      }
      
      const uploadData = await uploadRes.json();
      
      // Create story with uploaded media URL
      const storyPayload = {
        media: uploadData.url,
        mediaType: storyData.get('mediaType'),
        caption: storyData.get('caption')
      };

      const res = await fetch(`${API_URL}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(storyPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create story');
      
      setShowCreateStoryModal(false);
      setUploadingStory(false);
      setCreateStoryError('');
      fetchStories(); // Refresh stories
    } catch (err) {
      setCreateStoryError(err.message || 'Failed to create story');
      setUploadingStory(false);
    }
  };

  const handleStoryView = async (storyId) => {
    try {
      await fetch(`${API_URL}/stories/${storyId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark story as viewed:', err);
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      const res = await fetch(`${API_URL}/stories/${storyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchStories(); // Refresh stories
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
    }
  };

  // Fetch stories on mount
  useEffect(() => {
    if (token) {
      fetchStories();
    }
  }, [fetchStories]);

  // Reels functions
  const fetchReels = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReels(data);
    } catch (err) {
      console.error('Failed to fetch reels:', err);
      setReels([]);
    }
  }, [token]);

  const handleCreateReel = async (reelData) => {
    try {
      setUploadingReel(true);
      setCreateReelError('');

      // Upload video first
      const videoFormData = new FormData();
      videoFormData.append('video', reelData.get('video'));
      
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: videoFormData
      });
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }
      
      const uploadData = await uploadRes.json();
      
      // Create reel with uploaded video URL
      const reelPayload = {
        video: uploadData.url,
        caption: reelData.get('caption'),
        duration: reelData.get('duration')
      };

      const res = await fetch(`${API_URL}/reels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(reelPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create reel');
      
      setShowCreateReelModal(false);
      setUploadingReel(false);
      setCreateReelError('');
      fetchReels(); // Refresh reels
    } catch (err) {
      setCreateReelError(err.message || 'Failed to create reel');
      setUploadingReel(false);
    }
  };

  const handleReelView = async (reelId) => {
    try {
      await fetch(`${API_URL}/reels/${reelId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark reel as viewed:', err);
    }
  };

  const handleDeleteReel = async (reelId) => {
    try {
      const res = await fetch(`${API_URL}/reels/${reelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchReels(); // Refresh reels
      }
    } catch (err) {
      console.error('Failed to delete reel:', err);
    }
  };

  // Fetch reels on mount
  useEffect(() => {
    if (token) {
      fetchReels();
    }
  }, [fetchReels]);

  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPassword, setEditPassword] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(user?.isPrivate || false);

  useEffect(() => {
    setEditUsername(user?.username || '');
    setEditEmail(user?.email || '');
    setEditIsPrivate(user?.isPrivate || false);
  }, [user]);

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
          <div className="mt-6 text-center">
            <button
              type="button"
              className="w-full bg-white border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
              onClick={() => window.location.href = `${API_URL.replace('/api', '')}/api/auth/google`}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.68 30.18 0 24 0 14.82 0 6.73 5.82 2.69 14.09l7.98 6.19C12.13 13.16 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.28c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.19C.9 15.1 0 19.41 0 24c0 4.59.9 8.9 2.69 12.26l7.98-6.19z"/><path fill="#EA4335" d="M24 48c6.18 0 11.64-2.05 15.53-5.59l-7.19-5.6c-2.01 1.35-4.59 2.15-7.34 2.15-6.38 0-11.87-3.66-14.33-8.99l-7.98 6.19C6.73 42.18 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 transition-colors duration-500">
      {/* Sidebar: Desktop only */}
      <nav className="hidden md:flex fixed top-0 left-0 h-screen w-64 z-50 bg-black flex-col items-start py-8 border-r border-gray-800">
        <div className="mb-10 pl-8">
          <span className="text-3xl font-bold text-white tracking-tight">ConnectSphere</span>
        </div>
        <button
          className={`flex items-center w-full mb-2 pl-8 py-3 rounded-lg transition-all duration-200 focus:outline-none ${currentView === 'feed' ? 'bg-gray-900 text-blue-500 font-bold' : 'text-white hover:bg-gray-800'}`}
          onClick={() => setCurrentView('feed')}
          title="Feed"
          aria-label="Feed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white mr-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4.5l9 5.25M4.5 10.5v7.125A2.625 2.625 0 007.125 20.25h9.75A2.625 2.625 0 0019.5 17.625V10.5M8.25 20.25v-6h7.5v6" />
          </svg>
          <span className="ml-5 text-lg">Feed</span>
        </button>
        <button
          className={`flex items-center w-full mb-2 pl-8 py-3 rounded-lg transition-all duration-200 focus:outline-none ${currentView === 'explore' ? 'bg-gray-900 text-blue-500 font-bold' : 'text-white hover:bg-gray-800'}`}
          onClick={() => setCurrentView('explore')}
          title="Explore"
          aria-label="Explore"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white mr-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
          <span className="ml-5 text-lg">Explore</span>
        </button>
        <button
          className={`flex items-center w-full mb-2 pl-8 py-3 rounded-lg transition-all duration-200 focus:outline-none ${currentView === 'reels' ? 'bg-gray-900 text-blue-500 font-bold' : 'text-white hover:bg-gray-800'}`}
          onClick={() => setCurrentView('reels')}
          title="Reels"
          aria-label="Reels"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white mr-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m7.5 0v10.5A2.25 2.25 0 0113.5 21h-3A2.25 2.25 0 018.25 19.5V9m7.5 0H8.25m7.5 0H19.5A2.25 2.25 0 0121.75 11.25v7.5A2.25 2.25 0 0119.5 21.75H4.5A2.25 2.25 0 012.25 18.75v-7.5A2.25 2.25 0 014.5 9h3.75" />
          </svg>
          <span className="ml-5 text-lg">Reels</span>
        </button>
        <button
          className={`flex items-center w-full mb-2 pl-8 py-3 rounded-lg transition-all duration-200 focus:outline-none ${currentView === 'dm' ? 'bg-gray-900 text-blue-500 font-bold' : 'text-white hover:bg-gray-800'}`}
          onClick={() => setCurrentView('dm')}
          title="Messages"
          aria-label="Messages"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white mr-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5H4.5A2.25 2.25 0 012.25 17.25V6.75A2.25 2.25 0 014.5 4.5h15A2.25 2.25 0 0121.75 6.75z" />
          </svg>
          <span className="ml-5 text-lg">Messages</span>
        </button>
        <button
          className={`flex items-center w-full mb-2 pl-8 py-3 rounded-lg transition-all duration-200 focus:outline-none ${currentView === 'profile' ? 'bg-gray-900 text-blue-500 font-bold' : 'text-white hover:bg-gray-800'}`}
          onClick={() => {
            setCurrentView('profile');
            if (user && user._id) {
              setUserProfile(user);
              fetchUserProfile(user._id);
            }
          }}
          title="Profile"
          aria-label="Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white mr-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25V19.5z" />
          </svg>
          <span className="ml-5 text-lg">Profile</span>
        </button>
      </nav>
      {/* Bottom Nav Bar: Mobile only */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 w-full z-50 bg-white dark:bg-gray-900 flex justify-around items-center h-16 shadow">
        <button
          className={`flex flex-col items-center focus:outline-none ${currentView === 'feed' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setCurrentView('feed')}
          title="Feed"
          aria-label="Feed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4.5l9 5.25M4.5 10.5v7.125A2.625 2.625 0 007.125 20.25h9.75A2.625 2.625 0 0019.5 17.625V10.5M8.25 20.25v-6h7.5v6" />
          </svg>
          <span className="text-xs">Feed</span>
        </button>
        <button
          className={`flex flex-col items-center focus:outline-none ${currentView === 'explore' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setCurrentView('explore')}
          title="Explore"
          aria-label="Explore"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
          <span className="text-xs">Explore</span>
        </button>
        <button
          className={`flex flex-col items-center focus:outline-none ${currentView === 'reels' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setCurrentView('reels')}
          title="Reels"
          aria-label="Reels"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m7.5 0v10.5A2.25 2.25 0 0113.5 21h-3A2.25 2.25 0 018.25 19.5V9m7.5 0H8.25m7.5 0H19.5A2.25 2.25 0 0121.75 11.25v7.5A2.25 2.25 0 0119.5 21.75H4.5A2.25 2.25 0 012.25 18.75v-7.5A2.25 2.25 0 014.5 9h3.75" />
          </svg>
          <span className="text-xs">Reels</span>
        </button>
        <button
          className={`flex flex-col items-center focus:outline-none ${currentView === 'dm' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setCurrentView('dm')}
          title="Messages"
          aria-label="Messages"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5H4.5A2.25 2.25 0 012.25 17.25V6.75A2.25 2.25 0 014.5 4.5h15A2.25 2.25 0 0121.75 6.75z" />
          </svg>
          <span className="text-xs">Messages</span>
        </button>
        <button
          className={`flex flex-col items-center focus:outline-none ${currentView === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => {
            setCurrentView('profile');
            if (user && user._id) {
              setUserProfile(user);
              fetchUserProfile(user._id);
            }
          }}
          title="Profile"
          aria-label="Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25V19.5z" />
          </svg>
          <span className="text-xs">Profile</span>
        </button>
      </nav>
      {/* Main Content Area */}
      <main className="md:ml-64 flex flex-col items-center justify-start min-h-screen py-8 px-2 transition-all duration-500">
        <div className="w-full max-w-2xl mx-auto">
          {/* Global VideoCall UI: shows for incoming calls anywhere in the app */}
          {showVideoCall && globalIncomingCall && (
            <VideoCall
              show={showVideoCall}
              onClose={() => setShowVideoCall(false)}
              call={globalIncomingCall}
              user={user}
              activeChat={globalIncomingCall.callerUser}
            />
          )}
          {/* Header Navigation */}
          <div className="bg-white shadow sticky top-0 z-40 rounded-2xl mb-6">
            <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ConnectSphere
                </h1>
              </div>
              {/* Header Right: DM icon (mobile Feed), Search bar (Explore) */}
              <div className="flex items-center space-x-4">
                {/* DM Icon on Feed page (mobile only) */}
                {currentView === 'feed' && (
                  <button
                    className="md:hidden text-gray-500 dark:text-gray-400 text-2xl focus:outline-none"
                    onClick={() => setCurrentView('dm')}
                    title="Messages"
                  >
                    💬
                  </button>
                )}
                {/* Search bar: only on Explore page for mobile, all pages for md+ */}
                {(currentView === 'explore' || window.innerWidth >= 768) && (
                  <div className="relative w-full max-w-md mx-auto search-container">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSearch(true)}
                      aria-label="Search users"
                    />
                    {showSearch && searchResults.length > 0 && (
                      <ul className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                        {searchResults.map(user => (
                          <li
                            key={user._id}
                            className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150"
                            onMouseDown={() => navigateToProfile(user)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToProfile(user); } }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Go to profile of ${user.username}`}
                          >
                            <img
                              src={user.profileImage || '/default-avatar.png'}
                              alt={user.username}
                              className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                            />
                            <span className="font-medium text-gray-800 dark:text-white">{user.username}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {/* Notification and theme icons (unchanged) */}
                <button className="text-xl text-yellow-500 focus:outline-none" title="Notifications" aria-label="Notifications">
                  <span role="img" aria-label="bell">🔔</span>
                </button>
                <button
                  onClick={toggleDarkMode}
                  aria-label="Toggle dark mode"
                  className="relative w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full transition-colors duration-300 focus:outline-none"
                >
                  <span
                    className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white dark:bg-yellow-400 shadow transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`}
                  />
                  <span className="absolute left-2 top-1 text-xs text-yellow-500 dark:text-gray-800 transition-opacity duration-300" style={{opacity: darkMode ? 0 : 1}}>☀️</span>
                  <span className="absolute right-2 top-1 text-xs text-gray-800 dark:text-yellow-300 transition-opacity duration-300" style={{opacity: darkMode ? 1 : 0}}>🌙</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
          {/* Main Content (Feed, Stories, etc.) */}
          {currentView === 'dm' ? (
            <DM
              inbox={inbox}
              activeChat={activeChat}
              messages={messages}
              onSelectChat={userObj => setActiveChat(userObj)}
              onSendMessage={handleSendMessage}
              messageText={messageText}
              setMessageText={setMessageText}
              user={user}
              chatLoading={chatLoading}
              onNavigateToProfile={navigateToProfile}
            />
          ) : currentView === 'explore' ? (
            <Explore
              posts={explorePosts}
              onPostClick={openPostModal}
              onSearch={fetchExplorePosts}
            />
          ) : currentView === 'profile' ? (
            profileLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <div className="text-lg text-gray-600 dark:text-gray-300">Loading profile...</div>
              </div>
            ) : userProfile ? (
              <>
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
            ) : null
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
              stories={stories}
              onStoryView={handleStoryView}
              onCreateStory={() => setShowCreateStoryModal(true)}
              onDeleteStory={handleDeleteStory}
            />
          ) : currentView === 'reels' ? (
            <Reels
              reels={reels}
              user={user}
              onReelView={handleReelView}
              onCreateReel={() => setShowCreateReelModal(true)}
              onDeleteReel={handleDeleteReel}
              onNavigateToProfile={navigateToProfile}
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
      </main>
    </div>
  );
}

export default App;
