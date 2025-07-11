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

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'https://connectsphere-bice.vercel.app',
      'https://connectsphere-phi.vercel.app',
      'http://localhost:3000'
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: [
    'https://connectsphere-bice.vercel.app',
    'https://connectsphere-phi.vercel.app', // new Vercel domain
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

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
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
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
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for join event to join user-specific room
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(String(userId));
      console.log(`Socket ${socket.id} joined room ${userId}`);
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

  // WebRTC signaling events for calls
  socket.on('call:request', ({ to, from, callType }) => {
    io.to(String(to)).emit('call:incoming', { from, callType });
  });
  socket.on('call:accept', ({ to, from }) => {
    io.to(String(to)).emit('call:accepted', { from });
  });
  socket.on('call:signal', ({ to, from, signal }) => {
    io.to(String(to)).emit('call:signal', { from, signal });
  });
  socket.on('call:end', ({ to, from }) => {
    io.to(String(to)).emit('call:ended', { from });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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

// Google OAuth routes (only if credentials are available)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authController.googleAuthCallback);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));