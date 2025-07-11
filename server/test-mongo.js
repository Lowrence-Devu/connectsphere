const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://lowrencedevu:6k5GXTL9WDAqgRKA@cluster0.pgra28a.mongodb.net/connectsphere?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ name: String, timestamp: Date });
    const Test = mongoose.model('Test', testSchema);
    
    const testDoc = new Test({ name: 'Connection Test', timestamp: new Date() });
    await testDoc.save();
    console.log('✅ Database write test successful!');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

testConnection(); 