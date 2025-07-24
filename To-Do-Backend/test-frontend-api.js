const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());
// Configure CORS origins from environment variables
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ["http://localhost:3000", "http://localhost:5173"]; // fallback for development

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Test endpoint to simulate task creation
app.post('/api/test-tasks', async (req, res) => {
  try {
    console.log('📝 Test task creation request received:');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const { text, date } = req.body;
    
    if (!text || !date) {
      return res.status(400).json({ error: 'Text and date are required' });
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Task = require('./models/Task');
    
    const task = new Task({
      text,
      date,
      user: null // Test without user
    });
    
    const savedTask = await task.save();
    console.log('✅ Task saved:', savedTask);
    
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = 5001;
app.listen(port, () => {
  console.log(`🧪 Test server running on port ${port}`);
  console.log('Try: POST http://localhost:5001/api/test-tasks');
  console.log('Body: {"text": "Test task", "date": "2025-07-24T15:30:00.000Z"}');
});