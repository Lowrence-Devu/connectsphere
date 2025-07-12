# ConnectSphere Deployment Guide

## 🚀 Production Deployment Issues & Solutions

### Current Issues:
1. **Environment variables not set in production**
2. **API URLs pointing to localhost instead of production URLs**
3. **CORS configuration issues**
4. **Missing production environment files**

---

## 📋 Step-by-Step Fix

### 1. **Set Environment Variables in Vercel (Frontend)**

Go to your Vercel dashboard → Your Project → Settings → Environment Variables

**Add these variables:**
```
REACT_APP_API_URL = https://your-backend-app.onrender.com/api
REACT_APP_SOCKET_URL = https://your-backend-app.onrender.com
```

### 2. **Set Environment Variables in Render (Backend)**

Go to your Render dashboard → Your Backend Service → Environment

**Add these variables:**
```
MONGO_URI = mongodb+srv://lowrencedevu:6k5GXTL9WDAqgRKA@cluster0.pgra28a.mongodb.net/connectsphere?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET = connectsphere-jwt-secret-key-2024
SESSION_SECRET = connectsphere-session-secret-2024
CLIENT_URL = https://your-frontend-url.vercel.app
```

### 3. **Update Your URLs**

Replace `your-backend-app.onrender.com` with your actual Render backend URL
Replace `your-frontend-url.vercel.app` with your actual Vercel frontend URL

### 4. **Redeploy Both Services**

After setting environment variables:
- **Vercel**: Will auto-redeploy when you push to GitHub
- **Render**: Will auto-redeploy when you push to GitHub

---

## 🔧 Debugging Steps

### Check Browser Console:
1. Open your deployed app
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for error messages like:
   - "Failed to fetch posts"
   - CORS errors
   - Network errors

### Check Network Tab:
1. In Developer Tools, go to Network tab
2. Refresh the page
3. Look for failed API requests (red entries)
4. Check the response status codes

### Common Issues & Solutions:

#### Issue: "Failed to load posts"
**Solution:** Check if `REACT_APP_API_URL` is set correctly in Vercel

#### Issue: CORS errors
**Solution:** Check if your backend URL is in the CORS configuration

#### Issue: Socket.IO connection failed
**Solution:** Check if `REACT_APP_SOCKET_URL` is set correctly

---

## 🛠️ Manual Testing

### Test API Connection:
```bash
curl https://your-backend-app.onrender.com/api/posts
```

### Test Authentication:
```bash
curl -X POST https://your-backend-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 📝 Environment Variables Reference

### Frontend (Vercel):
```
REACT_APP_API_URL=https://your-backend-app.onrender.com/api
REACT_APP_SOCKET_URL=https://your-backend-app.onrender.com
```

### Backend (Render):
```
MONGO_URI=mongodb+srv://lowrencedevu:6k5GXTL9WDAqgRKA@cluster0.pgra28a.mongodb.net/connectsphere?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=connectsphere-jwt-secret-key-2024
SESSION_SECRET=connectsphere-session-secret-2024
CLIENT_URL=https://your-frontend-url.vercel.app
PORT=5000
```

---

## 🚨 Emergency Fix

If you need to quickly test if the backend is working:

1. **Temporarily allow all origins** in your server CORS:
```javascript
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true
}));
```

2. **Check if your backend is accessible** by visiting:
   `https://your-backend-app.onrender.com/api/posts`

3. **If backend is not responding**, check Render logs for errors

---

## 📞 Support

If you're still having issues:
1. Check the browser console for specific error messages
2. Check Render logs for backend errors
3. Verify all environment variables are set correctly
4. Make sure both services are deployed and running 