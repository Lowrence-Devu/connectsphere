const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const authController = require('./controllers/authController');
const groupRoutes = require('./routes/groups');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'https://connectsphere-rho.vercel.app',
      'https://connectsphere-bice.vercel.app',
      'https://connectsphere-phi.vercel.app',
      'https://connectsphere-lowrences-projects-9eb17f85.vercel.app',
      'https://connectsphere.vercel.app',
      'https://connectsphere-git-main-lowrences-projects.vercel.app',
      'http://localhost:3000'
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [
    'https://connectsphere-rho.vercel.app',
    'https://connectsphere-bice.vercel.app',
    'https://connectsphere-phi.vercel.app',
    'https://connectsphere-lowrences-projects-9eb17f85.vercel.app',
    'https://connectsphere.vercel.app',
    'https://connectsphere-git-main-lowrences-projects.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(__dirname + '/uploads'));

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport config
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://connectsphere-t43f.onrender.com/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = new User({
          username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random()*10000),
          email: profile.emails[0].value,
          profileImage: profile.photos[0]?.value || '',
          password: Math.random().toString(36).slice(-8) // random password
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
  console.log('Google OAuth strategy initialized');
} else {
  console.log('Google OAuth credentials not found - OAuth routes will not work');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  let userId = null;

  // Listen for join event to join user-specific room
  socket.on('join', (user) => {
    if (user) {
      userId = user;
      socket.join(String(user));
      console.log(`Socket ${socket.id} joined room ${user}`);
    }
  });

  // Real-time direct messaging
  socket.on('send_message', async (data) => {
    try {
      const { sender, receiver, text } = data;
      if (!sender || !receiver || !text) return;
      // Save message
      const message = await Message.create({ sender, receiver, text });
      const populated = await message.populate('sender', 'username profileImage');
      // Emit to receiver and sender
      io.to(String(receiver)).emit('receive_message', populated);
      io.to(String(sender)).emit('receive_message', populated);
    } catch (err) {
      console.error('Socket send_message error:', err);
    }
  });

  // Enhanced WebRTC signaling events for calls with better error handling and validation
  socket.on('call:request', ({ to, from, callType }) => {
    try {
      if (!to || !from || !callType) {
        console.error('Invalid call request data:', { to, from, callType });
        return;
      }
      console.log(`Call request from ${from} to ${to} (${callType})`);
    io.to(String(to)).emit('call:incoming', { from, callType });
    } catch (err) {
      console.error('Call request error:', err);
    }
  });
  
  socket.on('call:accept', ({ to, from }) => {
    try {
      if (!to || !from) {
        console.error('Invalid call accept data:', { to, from });
        return;
      }
      console.log(`Call accepted by ${from} to ${to}`);
    io.to(String(to)).emit('call:accepted', { from });
    } catch (err) {
      console.error('Call accept error:', err);
    }
  });
  
  socket.on('call:signal', ({ to, from, signal }) => {
    try {
      if (!to || !from || !signal) {
        console.error('Invalid call signal data:', { to, from, signal: !!signal });
        return;
      }
      console.log(`Signal from ${from} to ${to}`);
    io.to(String(to)).emit('call:signal', { from, signal });
    } catch (err) {
      console.error('Call signal error:', err);
    }
  });
  
  socket.on('call:end', ({ to, from }) => {
    try {
      if (!to || !from) {
        console.error('Invalid call end data:', { to, from });
        return;
      }
      console.log(`Call ended by ${from} to ${to}`);
    io.to(String(to)).emit('call:ended', { from });
    } catch (err) {
      console.error('Call end error:', err);
    }
  });
  
  // Single ICE candidate handler for all WebRTC flows with validation
  socket.on('ice-candidate', ({ to, from, candidate }) => {
    try {
      if (!to || !from || !candidate) {
        console.error('Invalid ICE candidate data:', { to, from, candidate: !!candidate });
        return;
      }
      console.log(`ICE candidate from ${from} to ${to}`);
      io.to(String(to)).emit('ice-candidate', { from, candidate });
    } catch (err) {
      console.error('ICE candidate error:', err);
    }
  });

  // Video call room management with cleanup
  socket.on('join-call', (callId) => {
    try {
      if (!callId) {
        console.error('Invalid call ID for join-call');
        return;
      }
    socket.join(callId);
    console.log(`Socket ${socket.id} joined call room ${callId}`);
    } catch (err) {
      console.error('Join call error:', err);
    }
  });
  
  socket.on('leave-call', (callId) => {
    try {
      if (!callId) {
        console.error('Invalid call ID for leave-call');
        return;
      }
    socket.leave(callId);
    console.log(`Socket ${socket.id} left call room ${callId}`);
    } catch (err) {
      console.error('Leave call error:', err);
    }
  });
  
  // WebRTC signaling with validation
  socket.on('offer', (data) => {
    try {
      if (!data.targetUserId || !data.offer || !data.callerId) {
        console.error('Invalid offer data:', data);
        return;
      }
    // Emit to the target user's room
    io.to(String(data.targetUserId)).emit('offer', {
      offer: data.offer,
      callerId: data.callerId
    });
    } catch (err) {
      console.error('Offer error:', err);
    }
  });
  
  socket.on('answer', (data) => {
    try {
      if (!data.targetUserId || !data.answer || !data.answererId) {
        console.error('Invalid answer data:', data);
        return;
      }
    // Emit to the target user's room
    io.to(String(data.targetUserId)).emit('answer', {
      answer: data.answer,
      answererId: data.answererId
    });
    } catch (err) {
      console.error('Answer error:', err);
    }
  });
  
  socket.on('call-ended', (data) => {
    try {
      if (!data.targetUserId || !data.callId || !data.endedBy) {
        console.error('Invalid call-ended data:', data);
        return;
      }
    // Emit to the target user's room
    io.to(String(data.targetUserId)).emit('call-ended', {
      callId: data.callId,
      endedBy: data.endedBy
    });
    } catch (err) {
      console.error('Call ended error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, 'User ID:', userId);
    // Clean up any active calls for this user
    if (userId) {
      // Notify other users that this user has disconnected
      socket.broadcast.emit('user_disconnected', { userId });
    }
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api', require('./routes/comments'));
app.use('/api', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/video-calls', require('./routes/videoCalls'));
app.use('/api/push-notifications', require('./routes/pushNotifications'));
app.use('/api/groups', groupRoutes);

// Google OAuth routes (only if credentials are available)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authController.googleAuthCallback);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));