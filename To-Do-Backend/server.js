const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config(); // Load environment variables from .env file
const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const sharedGroupRoutes = require('./routes/sharedGroups');
const feedbackRoutes = require('./routes/feedback');
const contactRoutes = require('./routes/contact');
const chatRoutes = require('./routes/chat');
const aiChatbotRoutes = require('./routes/aiChatbot');
const aiChatbotAnalyticsRoutes = require('./routes/aiChatbotAnalytics');

// Load AI Chatbot models to ensure they're registered
require('./models/AiChatSession');
require('./models/UserContextCache');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const setupSocketServer = require('./socket');
const io = setupSocketServer(server);

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

// Validate required environment variables
if (!mongoUri) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

// Middleware
app.use(express.json());

// Configure CORS origins from environment variables
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ["http://localhost:3000", "http://localhost:5173","https://to-do-advanced-rose.vercel.app"]; // fallback for development

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/shared-groups', sharedGroupRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-chatbot', aiChatbotRoutes);
app.use('/api/ai-chatbot', aiChatbotAnalyticsRoutes);

// MongoDB Connection
mongoose.connect(mongoUri)
  .then(() => {
    console.log('🚀 To-Do App (Beta) - MongoDB connected successfully');
    // Start the server with Socket.IO support
    server.listen(port, () => {
      console.log(`🌟 To-Do App Beta Server running on port ${port} - http://localhost:${port}`);
      console.log('💬 Socket.IO chat server enabled');
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