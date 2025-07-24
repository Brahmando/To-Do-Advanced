// Simple test to check if the API endpoints are working
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

// Test endpoint without authentication
app.post('/api/test-task', (req, res) => {
  console.log('📝 Test task endpoint hit');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  const { text, date } = req.body;
  
  if (!text || !date) {
    return res.status(400).json({ error: 'Text and date are required' });
  }
  
  // Simulate successful task creation
  const mockTask = {
    _id: Date.now().toString(),
    text,
    date,
    created: new Date().toISOString(),
    completed: false,
    deleted: false,
    user: null
  };
  
  console.log('✅ Mock task created:', mockTask);
  res.status(201).json(mockTask);
});

const port = 5002;
app.listen(port, () => {
  console.log(`🧪 Test API server running on port ${port}`);
  console.log('Test endpoint: POST http://localhost:5002/api/test-task');
});