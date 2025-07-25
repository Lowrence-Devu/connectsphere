import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Settings from './components/Settings';
import PostModal from './components/PostModal';
import CreateStoryModal from './components/CreateStoryModal';
import CreatePostModal from './components/CreatePostModal';
import Reels from './components/Reels';
import Explore from './components/Explore';
import DM from './components/DM';
import VideoCall from './components/VideoCall';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import './components/SplashScreen.css';
import Peer from 'simple-peer';
import CallModal from './components/CallModal';
import GroupList from './components/GroupList';
import CreateGroupModal from './components/CreateGroupModal';
import GroupChat from './components/GroupChat';

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
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [createStoryError, setCreateStoryError] = useState('');
  const [reels, setReels] = useState([]);
  const [showCreateReelModal, setShowCreateReelModal] = useState(false);
  const [uploadingReel, setUploadingReel] = useState(false);
  const [createReelError, setCreateReelError] = useState('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [globalIncomingCall, setGlobalIncomingCall] = useState(null);
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
  const [explorePosts, setExplorePosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [comments, setComments] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState('');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editIsPrivate, setEditIsPrivate] = useState(user?.isPrivate || false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [liveStream, setLiveStream] = useState(null);
  const [liveType, setLiveType] = useState(''); // 'post' or 'reel'
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState('');
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);

  // Add hooks for handling Google OAuth redirect
  const location = window.location;
  
  // Add app initialization state
  const [showSplash, setShowSplash] = useState(true);

  // Video call state
  const [globalCallActive, setGlobalCallActive] = useState(false);
  const [globalCalling, setGlobalCalling] = useState(false);

  // Add state for advanced call logic
  const [callModal, setCallModal] = useState({
    show: false,
    type: 'video',
    incoming: false,
    from: null,
    username: '',
  });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [muted, setMuted] = useState(false);

  // Add global loading states
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // Global error handler
  const handleGlobalError = (error, context = '') => {
    console.error(`[App] Global error in ${context}:`, error);
    setGlobalError(error.message || 'An unexpected error occurred');
    
    // Clear error after 5 seconds
    setTimeout(() => {
      setGlobalError(null);
    }, 5000);
  };

  // Global loading handler
  const withLoading = async (asyncFunction, context = '') => {
    try {
      setIsLoading(true);
      await asyncFunction();
    } catch (error) {
      handleGlobalError(error, context);
    } finally {
      setIsLoading(false);
    }
  };

  // Network status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[App] Network is online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[App] Network is offline');
      setGlobalError('You are offline. Some features may not work.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (showSplash) return;
    // Initialize app
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing application...');
        // Add a small delay to ensure all state is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        // setAppInitialized(true); // Removed as per edit hint
        console.log('[App] Application initialized successfully');
      } catch (error) {
        console.error('[App] Initialization error:', error);
        // setAppInitialized(true); // Still set to true to prevent infinite loading
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
      console.log('[App] Token found, initializing socket connection...');
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
      
      const connectSocket = () => {
        try {
          // Disconnect existing socket if any
          if (socket.current) {
            socket.current.disconnect();
            socket.current = null;
          }
          
          console.log('[App] Connecting to socket at:', getSocketUrl());
          
          socket.current = io(getSocketUrl(), {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            withCredentials: true
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
        console.error('[App] Error details:', {
          message: error.message,
          type: error.type,
          description: error.description
        });
        window.socketConnected = false;
      });
      
      socket.current.on('disconnect', (reason) => {
        console.log('[App] Socket disconnected:', reason);
        window.socketConnected = false;
            
            // Attempt to reconnect if not manually disconnected
            if (reason !== 'io client disconnect') {
              console.log('[App] Attempting to reconnect...');
              setTimeout(() => {
                if (socket.current) {
                  socket.current.connect();
                }
              }, 2000);
            }
          });
          
          socket.current.on('reconnect', (attemptNumber) => {
            console.log('[App] Reconnected after', attemptNumber, 'attempts');
            window.socketConnected = true;
            if (user?._id) {
              socket.current.emit('join', user._id);
            }
          });
          
          socket.current.on('reconnect_error', (error) => {
            console.error('[App] Reconnection error:', error);
          });
          
          socket.current.on('reconnect_failed', () => {
            console.error('[App] Reconnection failed');
            window.socketConnected = false;
      });
      
      socket.current.on('newPost', (post) => {
            console.log('[App] New post received:', post);
        setPosts(prev => [post, ...prev]);
      });
      
      socket.current.on('postLiked', (data) => {
            console.log('[App] Post liked:', data);
        setPosts(prev => prev.map(post => 
          post._id === data.postId 
            ? { ...post, likes: data.likes }
            : post
        ));
      });
      
      socket.current.on('newComment', (data) => {
            console.log('[App] New comment received:', data);
        setComments(prev => ({
          ...prev,
          [data.postId]: [...(prev[data.postId] || []), data.comment]
        }));
      });

      // Listen for real-time notifications
      socket.current.on('notification', (notif) => {
            console.log('[App] New notification received:', notif);
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
          
        } catch (error) {
          console.error('[App] Socket initialization error:', error);
        }
      };
      
      // Only connect if user is authenticated
      if (user?._id) {
        console.log('[App] User authenticated, connecting socket...');
        connectSocket();
      } else {
        console.log('[App] User not authenticated yet, skipping socket connection');
      }
      
      return () => {
        if (socket.current) {
          console.log('[App] Disconnecting socket...');
          socket.current.disconnect();
        }
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
      setInbox(Array.isArray(data) ? data : []);
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
        console.log('Received message:', msg, 'Current user:', user._id);
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
      sender: String(user._id),
      receiver: String(activeChat._id),
      text: messageText.trim(),
      createdAt: new Date().toISOString()
    };
    console.log('Sending message:', msg);
    if (socket.current) {
      socket.current.emit('send_message', msg);
    }
    setMessageText('');
  };

  // Enhanced debounced search effect with improved reliability
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      
      if (trimmedQuery.length >= 2) {
        searchUsers(trimmedQuery);
      } else if (trimmedQuery.length === 0) {
        setSearchResults([]);
        setShowSearch(false);
      } else {
        setSearchResults([]);
      }
    }, 250); // Slightly increased for better stability

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
      console.log('Fetching posts...');
      const res = await fetch(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Posts fetched successfully:', data.length);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please refresh the page.');
      
      // Retry after 3 seconds
      setTimeout(() => {
        console.log('Retrying posts fetch...');
        fetchPosts();
      }, 3000);
    }
  };

  // Fetch comments for a post
  const fetchComments = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`);
      const data = await res.json();
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (err) {
      // Optionally handle error
    }
  };

  // Fetch a single post and update in posts state
  const fetchSinglePost = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}`);
      const data = await res.json();
      setPosts(prev => prev.map(p => p._id === postId ? data : p));
    } catch (err) {
      // Optionally handle error
    }
  };

  // Optimistic + accurate comment submit
  const handleSubmitComment = async (postId) => {
    const commentText = commentText[postId]?.trim();
    if (!commentText) return;
    
    try {
      // Optimistic update - add comment immediately
      const optimisticComment = {
      _id: `temp-${Date.now()}`,
        text: commentText,
      author: user,
        postId: postId,
      createdAt: new Date().toISOString(),
        isOptimistic: true
    };
      
    setComments(prev => ({
      ...prev,
        [postId]: [...(prev[postId] || []), optimisticComment]
    }));
      
      // Clear input immediately
    setCommentText(prev => ({ ...prev, [postId]: '' }));
      
      // Make API call
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }
      
      const newComment = await res.json();
      console.log('Comment posted successfully:', newComment);
      
      // Replace optimistic comment with real one
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].map(comment => 
          comment.isOptimistic ? newComment : comment
        )
      }));
      
    } catch (err) {
      console.error('Error posting comment:', err);
      
      // Remove optimistic comment on error
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(comment => !comment.isOptimistic)
      }));
      
      // Restore comment text
      setCommentText(prev => ({ ...prev, [postId]: commentText }));
      
      alert('Failed to post comment. Please try again.');
    }
  };

  // Optimistic + accurate like
  const handleLike = async (postId) => {
    try {
      // Optimistic update - update UI immediately
    setPosts(prev => prev.map(post => {
      if (post._id === postId) {
          const isLiked = post.likes?.includes(user?._id);
          const newLikes = isLiked 
            ? post.likes.filter(id => id !== user?._id)
            : [...(post.likes || []), user?._id];
          return { ...post, likes: newLikes };
      }
      return post;
    }));
      
      // Make API call
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        // Revert optimistic update on error
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            const isLiked = post.likes?.includes(user?._id);
            const newLikes = isLiked 
              ? post.likes.filter(id => id !== user?._id)
              : [...(post.likes || []), user?._id];
            return { ...post, likes: newLikes };
          }
          return post;
        }));
        throw new Error('Failed to update like');
      }
      
      const data = await res.json();
      console.log('Like updated successfully:', data);
      
    } catch (err) {
      console.error('Error updating like:', err);
      alert('Failed to update like. Please try again.');
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
    console.log('handleCreatePostModal called with:', { caption, imageFile: imageFile?.name });
    setUploadingPost(true);
    setCreatePostError('');
    let imageUrl = '';
    
    try {
      // Validate file if provided
      if (imageFile) {
        // Check file size (max 10MB)
        if (imageFile.size > 10 * 1024 * 1024) {
          throw new Error('Image file is too large. Please select a file smaller than 10MB.');
        }
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
          throw new Error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
        }
        
        console.log('Uploading image to server...');
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.message || 'Image upload failed. Please try again.');
        }
        
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
        console.log('Image uploaded successfully:', imageUrl);
      }
      
      // Create post
      console.log('Creating post with:', { text: caption, image: imageUrl });
      const postRes = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: caption, image: imageUrl })
      });
      
      if (!postRes.ok) {
        const errorData = await postRes.json();
        throw new Error(errorData.message || 'Failed to create post. Please try again.');
      }
      
      const postData = await postRes.json();
      console.log('Post created successfully:', postData);
      
      // Success - close modal and refresh posts
      setShowCreatePostModal(false);
      setUploadingPost(false);
      setCreatePostError('');
      
      // Show success message
      alert('Post created successfully! 🎉');
      
      // Refresh posts with optimistic update
      setPosts(prev => [postData, ...prev]);
      
    } catch (err) {
      console.error('Error in handleCreatePostModal:', err);
      setCreatePostError(err.message || 'Failed to create post. Please try again.');
      setUploadingPost(false);
      
      // Show error message to user
      alert(`Error: ${err.message}`);
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
      setExplorePosts(Array.isArray(data) ? data : []);
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

  useEffect(() => {
    setEditUsername(user?.username || '');
    setEditEmail(user?.email || '');
    setEditIsPrivate(user?.isPrivate || false);
  }, [user]);

  // Add this handler to update comment text as user types
  const handleCommentInput = (postId, value) => {
    setCommentText(prev => ({ ...prev, [postId]: value }));
  };

  // Add this handler to submit a comment

  // Enhanced search users by query with improved reliability
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Show loading state immediately
    setSearching(true);
    setShowSearch(true);
    
    // Don't search if query is too short
    if (query.trim().length < 1) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    try {
      setSearching(true);
      setGlobalError(''); // Clear any previous errors
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      let searchResults = [];
      
      // Primary method: Use the backend search endpoint
      try {
        console.log('Searching with token:', token ? 'Token present' : 'No token');
        console.log('Search URL:', `${API_URL}/users/search?q=${encodeURIComponent(query.trim())}&limit=8`);
        
        const searchRes = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query.trim())}&limit=8`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        console.log('Search response status:', searchRes.status);
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          searchResults = searchData.users || [];
          console.log('Search results from backend:', searchResults);
        } else {
          const errorText = await searchRes.text();
          console.error('Search response error:', errorText);
          throw new Error(`Search failed: ${searchRes.status} - ${errorText}`);
        }
      } catch (primaryError) {
        console.error('Primary search method failed:', primaryError);
        
        // Fallback: Get all users and filter client-side
        try {
          const allUsersRes = await fetch(`${API_URL}/users`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          if (allUsersRes.ok) {
            const allUsers = await allUsersRes.json();
            
            // Advanced filtering with multiple criteria
            searchResults = allUsers.filter(user => {
              if (!user || !user._id || !user.username) return false;
              
              const queryLower = query.toLowerCase();
              const usernameLower = user.username.toLowerCase();
              const emailLower = user.email ? user.email.toLowerCase() : '';
              const bioLower = user.bio ? user.bio.toLowerCase() : '';
              
              return (
                usernameLower.includes(queryLower) ||
                emailLower.includes(queryLower) ||
                bioLower.includes(queryLower) ||
                usernameLower.startsWith(queryLower) // Prioritize exact matches
              );
            }).slice(0, 8); // Limit to 8 results for better performance
            
          } else {
            throw new Error(`Failed to fetch users: ${allUsersRes.status}`);
          }
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError);
          
          // Second fallback: Try to get users from posts
          try {
            const postsRes = await fetch(`${API_URL}/posts?limit=50`, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });
            
            if (postsRes.ok) {
              const posts = await postsRes.json();
              const userMap = new Map();
              
              posts.forEach(post => {
                if (post.author && post.author._id && post.author.username) {
                  const queryLower = query.toLowerCase();
                  const usernameLower = post.author.username.toLowerCase();
                  
                  if (!userMap.has(post.author._id) && 
                      (usernameLower.includes(queryLower) || usernameLower.startsWith(queryLower))) {
                    userMap.set(post.author._id, post.author);
                  }
                }
              });
              
              searchResults = Array.from(userMap.values()).slice(0, 8);
            } else {
              throw new Error('All search methods failed');
            }
          } catch (finalError) {
            console.error('All search methods failed:', finalError);
            throw new Error('Search service temporarily unavailable');
          }
        }
      }
      
      clearTimeout(timeoutId);
      
      // Final validation and processing
      const validResults = searchResults.filter(user => 
        user && user._id && user.username && user.username.trim()
      ).map(user => ({
        ...user,
        displayName: user.username,
        followers: user.followers || [],
        following: user.following || [],
        bio: user.bio || '',
        profileImage: user.profileImage || '',
        isPrivate: user.isPrivate || false,
        createdAt: user.createdAt || new Date()
      }));
      
      console.log('Final search results:', validResults);
      setSearchResults(validResults);
      
      if (validResults.length === 0) {
        // Show all users if no search results found
        try {
          const allUsersRes = await fetch(`${API_URL}/users`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (allUsersRes.ok) {
            const allUsers = await allUsersRes.json();
            const allUserResults = allUsers.slice(0, 8).map(user => ({
              ...user,
              displayName: user.username,
              followers: user.followers || [],
              following: user.following || [],
              bio: user.bio || '',
              profileImage: user.profileImage || '',
              isPrivate: user.isPrivate || false,
              createdAt: user.createdAt || new Date()
            }));
            setSearchResults(allUserResults);
          } else {
            setSearchResults([{ 
              _id: 'no-results', 
              username: 'No users found', 
              displayName: 'No users found',
              isNoResults: true 
            }]);
          }
    } catch (err) {
          setSearchResults([{ 
            _id: 'no-results', 
            username: 'No users found', 
            displayName: 'No users found',
            isNoResults: true 
          }]);
        }
      }
      
    } catch (err) {
      console.error('Search error:', err);
      
      if (err.name === 'AbortError') {
        setGlobalError('Search timed out. Please try again.');
      } else {
        setGlobalError(err.message || 'Search temporarily unavailable. Please try again.');
      }
      
      setSearchResults([]);
    } finally {
    setSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        console.log('Searching for:', searchQuery);
        console.log('Current user:', user);
        console.log('Current token:', token ? 'Present' : 'Missing');
        searchUsers(searchQuery);
        setShowSearch(true); // Always show search dropdown when typing
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 200); // Reduced delay for faster response

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Click outside handler for search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearch && !event.target.closest('.search-container')) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch]);

  // Fetch a user's profile and posts
  const fetchUserProfile = async (userId) => {
    try {
      setProfileLoading(true);
      console.log('Fetching user profile for:', userId);
      
      const res = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await res.json();
      console.log('User profile fetched successfully:', data);
      setUserProfile(data);
      
      // Fetch user's posts
      const postsRes = await fetch(`${API_URL}/users/${userId}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setUserPosts(postsData.posts || postsData); // Handle both new and old response format
      }
      
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile. Please try again.');
    } finally {
    setProfileLoading(false);
    }
  };

  // Enhanced navigate to a user's profile with better reliability
  const navigateToProfile = async (user) => {
    console.log('navigateToProfile called with:', user);
    if (!user || !user._id) {
      console.error('Invalid user data:', user);
      setGlobalError('Invalid user data. Please try again.');
      return;
    }
    
    try {
    setProfileLoading(true);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
      setGlobalError(''); // Clear any previous errors
      
      // Optimistic UI update
    setCurrentView('profile');
      console.log('Set current view to profile');
      
      await fetchUserProfile(user._id);
      console.log('Fetched user profile successfully');
      
      // Success feedback
      console.log(`Successfully navigated to ${user.username}'s profile`);
      
    } catch (err) {
      console.error('Error navigating to profile:', err);
      setGlobalError('Failed to load user profile. Please try again.');
      // Revert optimistic update
      setCurrentView('explore');
    } finally {
      setProfileLoading(false);
    }
  };

  // Follow a user
  const followUser = async (userId) => {
    try {
      // Optimistic update
      setUserProfile(prev => prev ? { ...prev, followers: [...(prev.followers || []), user._id] } : prev);
      
      const res = await fetch(`${API_URL}/users/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        // Revert optimistic update
        setUserProfile(prev => prev ? { ...prev, followers: prev.followers.filter(id => id !== user._id) } : prev);
        throw new Error('Failed to follow user');
      }
      
      console.log('User followed successfully');
      
    } catch (err) {
      console.error('Error following user:', err);
      alert('Failed to follow user. Please try again.');
    }
  };

  // Unfollow a user
  const unfollowUser = async (userId) => {
    try {
      // Optimistic update
      setUserProfile(prev => prev ? { ...prev, followers: prev.followers.filter(id => id !== user._id) } : prev);
      
      const res = await fetch(`${API_URL}/users/${userId}/unfollow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        // Revert optimistic update
        setUserProfile(prev => prev ? { ...prev, followers: [...(prev.followers || []), user._id] } : prev);
        throw new Error('Failed to unfollow user');
      }
      
      console.log('User unfollowed successfully');
      
    } catch (err) {
      console.error('Error unfollowing user:', err);
      alert('Failed to unfollow user. Please try again.');
    }
  };

  // Advanced call handling
  useEffect(() => {
    if (!socket.current) return;
    socket.current.on('call:incoming', ({ from, callType }) => {
      const userObj = inbox.find(u => u._id === from) || {};
      setCallModal({
        show: true,
        type: callType,
        incoming: true,
        from,
        username: userObj.username || 'Unknown',
      });
    });
    socket.current.on('call:accepted', ({ from }) => {
      startPeer(true, callModal.type);
    });
    socket.current.on('call:declined', () => {
      endCall();
    });
    socket.current.on('call:ended', () => {
      endCall();
    });
    socket.current.on('call:signal', ({ from, signal }) => {
      if (peer) peer.signal(signal);
    });
    return () => {
      socket.current.off('call:incoming');
      socket.current.off('call:accepted');
      socket.current.off('call:declined');
      socket.current.off('call:ended');
      socket.current.off('call:signal');
    };
  }, [socket, peer, callModal.type, inbox]);

  const initiateCall = (callType) => {
    setCallModal({
      show: true,
      type: callType,
      incoming: false,
      from: activeChat._id,
      username: activeChat.username,
    });
    socket.current.emit('call:initiate', { to: activeChat._id, from: user._id, callType });
  };

  const acceptCall = () => {
    socket.current.emit('call:accept', { to: callModal.from, from: user._id });
    startPeer(false, callModal.type);
    setCallModal((prev) => ({ ...prev, incoming: false }));
  };

  const declineCall = () => {
    socket.current.emit('call:decline', { to: callModal.from, from: user._id });
    endCall();
  };

  const endCall = () => {
    if (peer) peer.destroy();
    setPeer(null);
    setLocalStream(null);
    setRemoteStream(null);
    setCallModal({ show: false, type: 'video', incoming: false, from: null, username: '' });
    socket.current.emit('call:end', { to: callModal.from, from: user._id });
  };

  const muteCall = () => {
    setMuted(!muted);
    if (peer) {
      peer.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = !muted;
        }
      });
    }
  };

  const startPeer = async (initiator, type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === 'video',
      audio: true,
    });
    setLocalStream(stream);
    const newPeer = new Peer({
      initiator,
      trickle: false,
      stream,
    });
    newPeer.on('signal', (signal) => {
      socket.current.emit('call:signal', { to: callModal.from, from: user._id, signal });
    });
    newPeer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
    });
    newPeer.on('close', endCall);
    newPeer.on('error', endCall);
    setPeer(newPeer);
  };

  const handleLivePost = async () => {
    try {
      setLiveType('post');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          facingMode: 'environment'
        }, 
        audio: true 
      });
      setLiveStream(stream);
      setShowLiveCamera(true);
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Please allow camera access to create live content');
    }
  };

  const handleLiveReel = async () => {
    try {
      setLiveType('reel');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1080 }, 
          height: { ideal: 1920 },
          facingMode: 'environment'
        }, 
        audio: true 
      });
      setLiveStream(stream);
      setShowLiveCamera(true);
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Please allow camera access to create live content');
    }
  };

  const stopLiveStream = () => {
    if (liveStream) {
      liveStream.getTracks().forEach(track => track.stop());
      setLiveStream(null);
    }
    setShowLiveCamera(false);
    setLiveType('');
  };

  const captureLiveContent = async () => {
    if (!liveStream) return;
    
    try {
      const canvas = document.createElement('canvas');
      const video = document.createElement('video');
      video.srcObject = liveStream;
      await video.play();
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `live-${liveType}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        if (liveType === 'post') {
          setShowCreatePostModal(true);
          // You can pass the captured file to the post modal
        } else if (liveType === 'reel') {
          setShowCreateReelModal(true);
          // You can pass the captured file to the reel modal
        }
        
        stopLiveStream();
      }, 'image/jpeg');
    } catch (error) {
      console.error('Capture error:', error);
      alert('Failed to capture content');
    }
  };



  // Authentication functions
  const handleLogin = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      throw new Error(err.message || 'Registration failed');
    }
  };

  // Check if user is authenticated
  const isAuthenticated = user && token;

  useEffect(() => {
    if (token) fetchGroups();
  }, [token]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      setGroups([]);
    }
  };

  const handleCreateGroup = async ({ name, description, members }) => {
    setCreatingGroup(true);
    setCreateGroupError('');
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, members })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create group');
      }
      await fetchGroups();
      setShowCreateGroupModal(false);
    } catch (err) {
      setCreateGroupError(err.message);
    }
    setCreatingGroup(false);
  };

  const fetchGroupMessages = async (groupId) => {
    setLoadingGroupMessages(true);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGroupMessages(data);
    } catch (err) {
      setGroupMessages([]);
    }
    setLoadingGroupMessages(false);
  };

  const handleSendGroupMessage = async (text) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`${API_URL}/groups/${selectedGroup._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        fetchGroupMessages(selectedGroup._id);
      }
    } catch (err) {
      // Optionally show error
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={() => window.location.href = `${API_URL}/auth/google`}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950 transition-all duration-700 relative overflow-hidden">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.01)_25%,rgba(255,255,255,0.01)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.01)_75%)] bg-[length:20px_20px]"></div>
      
      {/* Floating Elements for Professional Touch */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center shadow-2xl border border-white/20 dark:border-gray-700/20">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* Global Error Toast */}
      {globalError && (
        <div className="fixed top-4 right-4 bg-red-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-sm border border-red-400/20 animate-in slide-in-from-right-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{globalError}</p>
            </div>
            <button 
              onClick={() => setGlobalError('')}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="fixed top-4 left-4 bg-amber-500/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl z-50 border border-amber-400/20 animate-in slide-in-from-left-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Offline Mode</p>
              <p className="text-xs text-amber-100">Limited functionality</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar: Desktop only */}
      <nav className="hidden md:flex fixed top-0 left-0 h-screen w-72 z-50 bg-black/95 backdrop-blur-xl flex-col items-start py-8 border-r border-white/10 shadow-2xl">
        <div className="mb-12 pl-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
              <span className="text-white font-bold text-xl">C</span>
        </div>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">ConnectSphere</span>
              <p className="text-xs text-gray-400 mt-1">Social Network</p>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full space-y-3 px-4">
        <button
            className={`group flex items-center w-full px-4 py-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:scale-[1.02] ${currentView === 'feed' ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 font-semibold shadow-xl border border-blue-500/30 shadow-blue-500/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          onClick={() => setCurrentView('feed')}
          title="Feed"
          aria-label="Feed"
        >
            <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'feed' ? 'bg-blue-500/30' : 'group-hover:bg-white/10'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4.5l9 5.25M4.5 10.5v7.125A2.625 2.625 0 007.125 20.25h9.75A2.625 2.625 0 0019.5 17.625V10.5M8.25 20.25v-6h7.5v6" />
          </svg>
            </div>
            <span className="text-lg ml-4">Feed</span>
            {currentView === 'feed' && (
              <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
        </button>
        <button
            className={`group flex items-center w-full px-4 py-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:scale-[1.02] ${currentView === 'explore' ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 font-semibold shadow-xl border border-blue-500/30 shadow-blue-500/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          onClick={() => setCurrentView('explore')}
          title="Explore"
          aria-label="Explore"
        >
            <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'explore' ? 'bg-blue-500/30' : 'group-hover:bg-white/10'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
            </div>
            <span className="text-lg ml-4">Explore</span>
            {currentView === 'explore' && (
              <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
        </button>
        <button
            className={`group flex items-center w-full px-4 py-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:scale-[1.02] ${currentView === 'reels' ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 font-semibold shadow-xl border border-blue-500/30 shadow-blue-500/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          onClick={() => setCurrentView('reels')}
          title="Reels"
          aria-label="Reels"
        >
            <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'reels' ? 'bg-blue-500/30' : 'group-hover:bg-white/10'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m7.5 0v10.5A2.25 2.25 0 0113.5 21h-3A2.25 2.25 0 018.25 19.5V9m7.5 0H8.25m7.5 0H19.5A2.25 2.25 0 0121.75 11.25v7.5A2.25 2.25 0 0119.5 21.75H4.5A2.25 2.25 0 012.25 18.75v-7.5A2.25 2.25 0 014.5 9h3.75" />
          </svg>
            </div>
            <span className="text-lg ml-4">Reels</span>
            {currentView === 'reels' && (
              <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
        </button>
        <button
            className={`group flex items-center w-full px-4 py-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:scale-[1.02] ${currentView === 'dm' ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 font-semibold shadow-xl border border-blue-500/30 shadow-blue-500/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          onClick={() => setCurrentView('dm')}
          title="Messages"
          aria-label="Messages"
        >
            <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'dm' ? 'bg-blue-500/30' : 'group-hover:bg-white/10'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5H4.5A2.25 2.25 0 012.25 17.25V6.75A2.25 2.25 0 014.5 4.5h15A2.25 2.25 0 0121.75 6.75z" />
          </svg>
            </div>
            <span className="text-lg ml-4">Messages</span>
            {currentView === 'dm' && (
              <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
        </button>
        <button
            className={`group flex items-center w-full px-4 py-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:scale-[1.02] ${currentView === 'profile' ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 font-semibold shadow-xl border border-blue-500/30 shadow-blue-500/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
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
            <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'profile' ? 'bg-blue-500/30' : 'group-hover:bg-white/10'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25V19.5z" />
          </svg>
            </div>
            <span className="text-lg ml-4">Profile</span>
            {currentView === 'profile' && (
              <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
        </button>
        </div>
        <div className="px-8 w-full space-y-3">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user?.username || 'User'}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email || 'Not logged in'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={() => {
              console.log('🔄 Logging out...');
              
              // Clear all storage
              localStorage.clear();
              sessionStorage.clear();
              
              // Clear cookies
              document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
              });
              
              // Clear cache storage
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => {
                    caches.delete(name);
                    console.log('🗑️ Cache deleted:', name);
                  });
                });
              }
              
              // Clear IndexedDB
              if ('indexedDB' in window) {
                indexedDB.databases().then(databases => {
                  databases.forEach(db => {
                    indexedDB.deleteDatabase(db.name);
                    console.log('🗑️ IndexedDB deleted:', db.name);
                  });
                });
              }
              
              // Disconnect socket
              if (socket.current) {
                socket.current.disconnect();
                console.log('🔌 Socket disconnected');
              }
              
              // Reset app state to show splash screen
              setUser(null);
              setToken('');
              setShowSplash(true);
              setCurrentView('feed');
              
              console.log('✅ All data cleared, reloading...');
              
              // Force reload after a short delay to ensure everything is cleared
              setTimeout(() => {
                window.location.href = window.location.origin;
              }, 100);
            }}
            className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50 shadow-xl"
            title="Logout"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </div>
          </button>
        </div>
      </nav>
      {/* Enhanced Bottom Nav Bar: Mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/20 shadow-lg h-20 md:hidden">
        <div className="flex justify-evenly items-center w-full h-full">
          {/* For each nav button, add 'flex-1 mx-1' to the button className */}
          {/* Feed */}
          <button className={`flex-1 mx-1 group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              currentView === 'feed' 
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 scale-110 shadow-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
            }`}
          onClick={() => setCurrentView('feed')}
          title="Feed"
          aria-label="Feed"
        >
            <div className={`p-1 rounded-xl transition-all duration-300 ${currentView === 'feed' ? 'bg-blue-500/30' : 'group-hover:bg-blue-500/15'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4.5l9 5.25M4.5 10.5v7.125A2.625 2.625 0 007.125 20.25h9.75A2.625 2.625 0 0019.5 17.625V10.5M8.25 20.25v-6h7.5v6" />
          </svg>
            </div>
            <span className="text-xs font-medium mt-0.5">Feed</span>
            {currentView === 'feed' && (
              <div className="absolute -top-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
            )}
        </button>

          {/* Explore */}
          <button className={`flex-1 mx-1 group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              currentView === 'explore' 
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 scale-110 shadow-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
            }`}
          onClick={() => setCurrentView('explore')}
          title="Explore"
          aria-label="Explore"
        >
            <div className={`p-1 rounded-xl transition-all duration-300 ${currentView === 'explore' ? 'bg-blue-500/30' : 'group-hover:bg-blue-500/15'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
            </div>
            <span className="text-xs font-medium mt-0.5">Explore</span>
            {currentView === 'explore' && (
              <div className="absolute -top-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
            )}
        </button>

          {/* Create (center) */}
          <button className="flex-1 mx-1 group flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-2xl transform hover:scale-110 transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-blue-500/30 -mt-8"
            onClick={() => setShowCreatePostModal(true)}
            title="Create Post"
            aria-label="Create Post"
          >
            <div className="p-1 rounded-xl transition-all duration-300 group-hover:bg-white/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-medium mt-0.5">Create</span>
          </button>

          {/* Reels */}
          <button className={`flex-1 mx-1 group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              currentView === 'reels' 
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 scale-110 shadow-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
            }`}
          onClick={() => setCurrentView('reels')}
          title="Reels"
          aria-label="Reels"
        >
            <div className={`p-1 rounded-xl transition-all duration-300 ${currentView === 'reels' ? 'bg-blue-500/30' : 'group-hover:bg-blue-500/15'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m7.5 0v10.5A2.25 2.25 0 0113.5 21h-3A2.25 2.25 0 018.25 19.5V9m7.5 0H8.25m7.5 0H19.5A2.25 2.25 0 0121.75 11.25v7.5A2.25 2.25 0 0119.5 21.75H4.5A2.25 2.25 0 012.25 18.75v-7.5A2.25 2.25 0 014.5 9h3.75" />
          </svg>
            </div>
            <span className="text-xs font-medium mt-0.5">Reels</span>
            {currentView === 'reels' && (
              <div className="absolute -top-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
            )}
        </button>

          {/* Messages */}
          <button className={`flex-1 mx-1 group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 relative ${
              currentView === 'dm' 
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 scale-110 shadow-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
            }`}
          onClick={() => setCurrentView('dm')}
          title="Messages"
          aria-label="Messages"
        >
            <div className={`p-1 rounded-xl transition-all duration-300 ${currentView === 'dm' ? 'bg-blue-500/30' : 'group-hover:bg-blue-500/15'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5H4.5A2.25 2.25 0 012.25 17.25V6.75A2.25 2.25 0 014.5 4.5h15A2.25 2.25 0 0121.75 6.75z" />
          </svg>
            </div>
            <span className="text-xs font-medium mt-0.5">Messages</span>
            {currentView === 'dm' && (
              <div className="absolute -top-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
            )}
            {/* Unread messages indicator */}
            {inbox.filter(chat => chat.unread > 0).length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">
                  {inbox.filter(chat => chat.unread > 0).length}
                </span>
              </div>
            )}
        </button>

          {/* Profile */}
          <button className={`flex-1 mx-1 group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              currentView === 'profile' 
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 scale-110 shadow-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
            }`}
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
            <div className={`p-1 rounded-xl transition-all duration-300 ${currentView === 'profile' ? 'bg-blue-500/30' : 'group-hover:bg-blue-500/15'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25V19.5z" />
          </svg>
            </div>
            <span className="text-xs font-medium mt-0.5">Profile</span>
            {currentView === 'profile' && (
              <div className="absolute -top-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
            )}
        </button>
        </div>
      </nav>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <div>
              <span className="text-base font-semibold text-gray-900 dark:text-white">ConnectSphere</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="relative p-1.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              title="Notifications"
              aria-label="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 10.5v7.125A2.625 2.625 0 007.125 20.25h9.75A2.625 2.625 0 0019.5 17.625V10.5m-10.5 6v-6.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V16.5m-6 0H7.5m6 0h-.375M21 10.5c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 6.285 6.285 0 01-1.5-.129l-.375-.125a21.498 21.498 0 01-2.625-.375 21.75 21.75 0 01-5.625-.75.75.75 0 01-.75-.75v-.75m12.75 0a21 21 0 00-1.5-.375c1.125-1.125 1.125-2.625 0-3.75a2.625 2.625 0 00-2.625-2.625H9.75a2.625 2.625 0 00-2.625 2.625c0 1.125 0 2.625 1.125 3.75H21z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="md:ml-72 flex flex-1 flex-col items-center justify-start h-full min-h-screen py-8 px-4 transition-all duration-500 relative md:pt-8 pt-20 pb-24 md:pb-8">
        <div className="w-full max-w-4xl mx-auto relative">
          {/* Content Container with Glass Effect */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6 sm:p-8">
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
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg sticky top-0 z-40 rounded-2xl mb-6 sm:mb-8 border border-white/30 dark:border-gray-700/30">
              <div className="flex items-center justify-between sm:justify-between px-4 sm:px-6 h-14 sm:h-16">
                {/* Mobile header layout by page */}
                {/* Feed: logo left, ConnectSphere center, avatar right */}
                {currentView === 'feed' && (
                  <>
                    <div className="flex-1 flex items-center justify-start">
                <img
                  src="/connectsphere-logo.png"
                  alt="ConnectSphere Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm inline-block align-middle"
                />
              </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent align-middle">ConnectSphere</span>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-2">
                  <button
                        onClick={() => setShowCreatePostModal(true)}
                        className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200 focus:outline-none shadow-lg hidden md:flex"
                        title="Create Post"
                        aria-label="Create Post"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                  </button>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        aria-label="Toggle dark mode"
                        className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300 focus:outline-none flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
                {/* Explore: logo left, ConnectSphere center, dark mode right */}
                {currentView === 'explore' && (
                  <>
                    <div className="flex-1 flex items-center justify-start">
                      <img
                        src="/connectsphere-logo.png"
                        alt="ConnectSphere Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm inline-block align-middle"
                      />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent align-middle">ConnectSphere</span>
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                      <button
                        onClick={toggleDarkMode}
                        aria-label="Toggle dark mode"
                        className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300 focus:outline-none flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
                {/* Reels: logo left, ConnectSphere center, notification
                 and avatar right */}
                {currentView === 'reels' && (
                  <>
                    <div className="flex-1 flex items-center justify-start">
                      <img
                        src="/connectsphere-logo.png"
                        alt="ConnectSphere Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm inline-block align-middle"
                      />
                  </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent align-middle">ConnectSphere</span>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <button
                        className="relative focus:outline-none group"
                        title="Notifications"
                        aria-label="Notifications"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200"
                        >
                          <path d="M18 16v-5a6 6 0 10-12 0v5a2 2 0 01-2 2h16a2 2 0 01-2-2z" />
                          <path d="M13.73 21a2 2 0 01-3.46 0" />
                        </svg>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center animate-bounce">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                </button>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                <button
                  onClick={toggleDarkMode}
                  aria-label="Toggle dark mode"
                        className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300 focus:outline-none flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
                {/* Profile: logo left, ConnectSphere center, dark mode right */}
                {currentView === 'profile' && (
                  <>
                    <div className="flex-1 flex items-center justify-start">
                      <img
                        src="/connectsphere-logo.png"
                        alt="ConnectSphere Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm inline-block align-middle"
                      />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent align-middle">ConnectSphere</span>
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                      <button
                        onClick={toggleDarkMode}
                        aria-label="Toggle dark mode"
                        className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300 focus:outline-none flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                </button>
                    </div>
                  </>
                )}
                {/* Desktop fallback for other pages */}
                {!(currentView === 'feed' || currentView === 'explore' || currentView === 'reels' || currentView === 'profile') && (
                  <>
                    <div className="flex-1 flex items-center justify-start">
                      <img
                        src="/connectsphere-logo.png"
                        alt="ConnectSphere Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm inline-block align-middle"
                      />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent align-middle ml-2">ConnectSphere</span>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                      <button
                        onClick={toggleDarkMode}
                        aria-label="Toggle dark mode"
                        className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300 focus:outline-none flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      </button>
              </div>
                  </>
                )}
            </div>
          </div>
          {/* Main Content (Feed, Stories, etc.) */}
          {currentView === 'dm' ? (
              <div className="flex flex-1 h-[70vh] md:h-[80vh] min-h-[400px]">
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
              onStartCall={initiateCall}
              socket={socket.current}
            />
              </div>
          ) : currentView === 'explore' ? (
            <Explore
              posts={Array.isArray(explorePosts) ? explorePosts : []}
              onPostClick={openPostModal}
              onSearch={fetchExplorePosts}
              searchUsers={searchUsers}
              searchResults={searchResults}
              showSearch={showSearch}
              setShowSearch={setShowSearch}
              navigateToProfile={navigateToProfile}
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
            ) : currentView === 'settings' ? (
              <Settings
                user={user}
                onUpdateProfile={async (data) => {/* TODO: implement update logic */}}
                onLogout={() => {
                  console.log('🔄 Logging out from Settings...');
                  
                  // Clear all storage
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Clear cookies
                  document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                  });
                  
                  // Clear cache storage
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => {
                        caches.delete(name);
                        console.log('🗑️ Cache deleted:', name);
                      });
                    });
                  }
                  
                  // Clear IndexedDB
                  if ('indexedDB' in window) {
                    indexedDB.databases().then(databases => {
                      databases.forEach(db => {
                        indexedDB.deleteDatabase(db.name);
                        console.log('🗑️ IndexedDB deleted:', db.name);
                      });
                    });
                  }
                  
                  // Disconnect socket
                  if (socket.current) {
                    socket.current.disconnect();
                    console.log('🔌 Socket disconnected');
                  }
                  
                  console.log('✅ All data cleared, reloading...');
                  
                  // Reset app state to show splash screen
                  setUser(null);
                  setToken('');
                  setShowSplash(true);
                  setCurrentView('feed');
                  
                  // Force reload after a short delay to ensure everything is cleared
                  setTimeout(() => {
                    window.location.href = window.location.origin;
                  }, 100);
                }}
                onDeleteAccount={async () => {/* TODO: implement delete logic */}}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                onBack={() => setCurrentView('profile')}
              />
          ) : currentView === 'feed' ? (
            <Feed
              posts={Array.isArray(posts) ? posts : []}
              user={user}
              comments={comments}
              showComments={showComments}
              commentText={commentText}
              onLike={handleLike}
              onCommentInput={handleCommentInput}
              onSubmitComment={handleSubmitComment}
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
              onDeleteComment={handleDeleteComment}
              commentText={commentText[selectedPost._id] || ''}
              onCommentInput={handleCommentInput}
              onSubmitComment={handleSubmitComment}
            />
          )}
          {showCreateStoryModal && (
            <CreateStoryModal
              onClose={() => setShowCreateStoryModal(false)}
              onCreate={async ({ mediaFile, mediaType }) => {
                const formData = new FormData();
                formData.append('media', mediaFile);
                formData.append('mediaType', mediaType);
                await handleCreateStory(formData);
              }}
              uploading={uploadingStory}
              error={createStoryError}
            />
          )}
          {callModal.show && (
            <CallModal
              show={callModal.show}
              type={callModal.type}
              localStream={localStream}
              remoteStream={remoteStream}
              onEnd={endCall}
              onMute={muteCall}
              muted={muted}
              incoming={callModal.incoming}
              onAccept={acceptCall}
              onDecline={declineCall}
              username={callModal.username}
            />
          )}

            {showLiveCamera && liveStream && (
              <div className="fixed inset-0 bg-black z-50 flex flex-col">
                {/* Camera View */}
                <div className="flex-1 relative">
                  <video
                    ref={(video) => {
                      if (video) {
                        video.srcObject = liveStream;
                        video.play();
                      }
                    }}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <div className="flex items-center justify-center gap-6">
                      {/* Close Button */}
                      <button
                        onClick={stopLiveStream}
                        className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors duration-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Capture Button */}
                      <button
                        onClick={captureLiveContent}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-300"></div>
                      </button>
                      
                      {/* Switch Camera Button */}
                      <button
                        onClick={() => {
                          // Switch between front and back camera
                          stopLiveStream();
                          if (liveType === 'post') {
                            handleLivePost();
                          } else {
                            handleLiveReel();
                          }
                        }}
                        className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center text-white hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Live Indicator */}
                  <div className="absolute top-6 left-6 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                  
                  {/* Content Type Indicator */}
                  <div className="absolute top-6 right-6 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {liveType === 'post' ? 'POST' : 'REEL'}
                  </div>
                </div>
              </div>
            )}
            {showCreatePostModal && (
              <CreatePostModal
                onClose={() => setShowCreatePostModal(false)}
                onCreate={handleCreatePostModal}
                uploading={uploadingPost}
                error={createPostError}
              />
            )}
          </div>
        </div>
      </main>
      {showPostModal && selectedPost && (
        <PostModal
          post={selectedPost}
          user={user}
          comments={comments[selectedPost._id] || []}
          onClose={closePostModal}
          onLike={() => handleLike(selectedPost._id)}
          onDeleteComment={handleDeleteComment}
          commentText={commentText[selectedPost._id] || ''}
          onCommentInput={handleCommentInput}
          onSubmitComment={handleSubmitComment}
        />
      )}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onCreate={handleCreateGroup}
          creating={creatingGroup}
          error={createGroupError}
        />
      )}

      {selectedGroup && (
        <GroupChat
          group={selectedGroup}
          messages={groupMessages}
          onSendMessage={handleSendGroupMessage}
          user={user}
          loading={loadingGroupMessages}
        />
      )}
    </div>
  );
}

export default App;
