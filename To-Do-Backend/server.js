const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file
const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const sharedGroupRoutes = require('./routes/sharedGroups');

const app = express();

// Environment variables
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

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
    console.log('MongoDB connected successfully');
    // Start the server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Basic route for testing
app.get('/', (req, res) => {
  res.send('To-Do App Backend');
});