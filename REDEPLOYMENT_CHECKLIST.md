# ConnectSphere Redeployment Checklist

## 🚀 Complete Redeployment Guide

Since you've deleted your projects from Vercel and Render, here's how to redeploy everything from scratch.

---

## 📋 Pre-Deployment Checklist

### ✅ **Code Ready:**
- [x] All code committed to GitHub
- [x] No build errors
- [x] Environment files present
- [x] Security issues addressed

---

## 🔧 Step 1: Deploy Backend to Render

### **1.1 Go to Render Dashboard**
- Visit: https://dashboard.render.com
- Sign in with your GitHub account

### **1.2 Create New Web Service**
- Click "New +" → "Web Service"
- Connect your GitHub repository: `connectsphere`

### **1.3 Configure Service Settings**
```
Name: connectsphere-backend
Root Directory: server
Build Command: npm install
Start Command: npm start
```

### **1.4 Set Environment Variables**
Go to Environment tab and add:
```
MONGO_URI = mongodb+srv://lowrencedevu:6k5GXTL9WDAqgRKA@cluster0.pgra28a.mongodb.net/connectsphere?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET = connectsphere-jwt-secret-key-2024
SESSION_SECRET = connectsphere-session-secret-2024
PORT = 5000
```

### **1.5 Deploy**
- Click "Create Web Service"
- Wait for deployment to complete
- **Save your backend URL** (e.g., `https://connectsphere-backend.onrender.com`)

---

## 🎨 Step 2: Deploy Frontend to Vercel

### **2.1 Go to Vercel Dashboard**
- Visit: https://vercel.com/dashboard
- Sign in with your GitHub account

### **2.2 Create New Project**
- Click "New Project"
- Import your GitHub repository: `connectsphere`

### **2.3 Configure Project Settings**
```
Framework Preset: Create React App
Root Directory: client
Build Command: npm run build
Output Directory: build
```

### **2.4 Set Environment Variables**
Go to Project Settings → Environment Variables and add:
```
REACT_APP_API_URL = https://your-backend-url.onrender.com/api
REACT_APP_SOCKET_URL = https://your-backend-url.onrender.com
```
*(Replace with your actual Render backend URL)*

### **2.5 Deploy**
- Click "Deploy"
- Wait for deployment to complete
- **Save your frontend URL** (e.g., `https://connectsphere.vercel.app`)

---

## 🔄 Step 3: Update CORS Configuration

### **3.1 Update server/server.js**
Add your new Vercel URL to the CORS origins:

```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      'https://your-new-vercel-url.vercel.app',  // Add this
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

app.use(cors({
  origin: [
    'https://your-new-vercel-url.vercel.app',  // Add this
    'https://connectsphere-bice.vercel.app',
    'https://connectsphere-phi.vercel.app',
    'https://connectsphere-lowrences-projects-9eb17f85.vercel.app',
    'https://connectsphere.vercel.app',
    'https://connectsphere-git-main-lowrences-projects.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

### **3.2 Update Environment Variables**
Update your Render backend environment variables:
```
CLIENT_URL = https://your-new-vercel-url.vercel.app
```

---

## 🚀 Step 4: Redeploy Everything

### **4.1 Commit and Push Changes**
```bash
git add .
git commit -m "Update CORS with new deployment URLs"
git push origin main
```

### **4.2 Monitor Deployments**
- **Render:** Will auto-redeploy when you push to GitHub
- **Vercel:** Will auto-redeploy when you push to GitHub

### **4.3 Test Your Application**
1. Visit your new Vercel URL
2. Test user registration/login
3. Test creating posts
4. Test real-time features
5. Check browser console for errors

---

## 🔍 Troubleshooting

### **Common Issues:**

#### **CORS Errors:**
- Make sure your Vercel URL is in the CORS origins array
- Check that environment variables are set correctly

#### **API Connection Errors:**
- Verify `REACT_APP_API_URL` points to your Render backend
- Check that your backend is running on Render

#### **Build Errors:**
- Check Vercel build logs for specific errors
- Ensure all dependencies are installed

#### **Database Connection:**
- Verify MongoDB connection string is correct
- Check Render logs for database connection errors

---

## 📞 Support

If you encounter issues:
1. Check deployment logs in both Vercel and Render
2. Verify environment variables are set correctly
3. Test API endpoints individually
4. Check browser console for client-side errors

---

## ✅ Success Checklist

- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables set correctly
- [ ] CORS configuration updated
- [ ] Application loads without errors
- [ ] Authentication works
- [ ] Posts can be created
- [ ] Real-time features work
- [ ] No console errors

**🎉 Once all items are checked, your ConnectSphere app will be live again!** 