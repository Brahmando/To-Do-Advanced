const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file
const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const sharedGroupRoutes = require('./routes/sharedGroups');

const app = express();

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://powerangerinfinite123:n2n1RXzFsHFfzmNJ@mongocluster.pe7odxo.mongodb.net/todo_app?retryWrites=true&w=majority&appName=MongoCluster";

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/shared-groups', sharedGroupRoutes);

// MongoDB Connection
mongoose.connect(mongoUri)
  .then(() => {
    console.log('🚀 To-Do App (Beta) - MongoDB connected successfully');
    // Start the server
    app.listen(port, () => {
      console.log(`🌟 To-Do App Beta Server running on port ${port} - http://localhost:${port}`);
      console.log('📧 Email service configured for OTP verification');
      console.log('⚠️  Beta version - Please report any issues!');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Basic route for testing
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1>🚀 To-Do App Backend (Beta)</h1>
      <p>Backend server is running successfully!</p>
      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px; border: 1px solid #ffeaa7;">
        <p><strong>⚠️ Beta Version Notice:</strong></p>
        <p>This application is currently in beta testing phase.</p>
        <p>Email verification is required for user registration.</p>
      </div>
      <p><strong>Available Endpoints:</strong></p>
      <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
        <li>POST /api/auth/register - Register new user (with OTP)</li>
        <li>POST /api/auth/verify-otp - Verify email OTP</li>
        <li>POST /api/auth/resend-otp - Resend OTP</li>
        <li>POST /api/auth/login - User login</li>
        <li>GET /api/tasks - Get user tasks</li>
        <li>POST /api/tasks - Create new task</li>
      </ul>
    </div>
  `);
});