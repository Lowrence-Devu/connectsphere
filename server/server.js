const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://connectsphere-bice.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: [
    'https://connectsphere-bice.vercel.app', // your Vercel frontend URL
    'http://localhost:3000', // for local development
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
