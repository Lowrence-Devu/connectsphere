# ConnectSphere

A full-stack social media application inspired by Instagram, built with modern web technologies.

## 🚀 Features

- **User Authentication**: Secure login/signup with JWT tokens
- **Post Management**: Create, edit, delete posts with image uploads
- **Social Interactions**: Like, comment, and share posts
- **Real-time Messaging**: Direct messaging between users
- **User Profiles**: Customizable profiles with bio and avatar
- **Notifications**: Real-time notifications for interactions
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **JWT** - Authentication

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/connectsphere.git
   cd connectsphere
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the server directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
   
   Create a `.env` file in the client directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start the development servers**
   ```bash
   # Start backend server (from server directory)
   npm run dev
   
   # Start frontend server (from client directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🏗️ Project Structure

```
connectsphere/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── models/           # MongoDB models
│   ├── middleware/       # Express middleware
│   ├── uploads/          # File uploads
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/posts` - Get user posts

### Comments
- `POST /api/posts/:id/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

### Messages
- `GET /api/messages` - Get conversations
- `POST /api/messages` - Send message

## 🎨 Features in Detail

### Feed
- Infinite scroll posts
- Like and comment functionality
- User navigation to profiles

### Profile
- User information display
- Post grid view
- Edit profile functionality

### Messages
- Real-time messaging
- Conversation list
- Message history

### Explore
- Discover new content
- Search functionality
- Trending posts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Instagram for inspiration
- React and Node.js communities
- Tailwind CSS for the beautiful styling framework 