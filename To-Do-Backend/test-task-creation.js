const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Test script to debug task creation
async function testTaskCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import Task model
    const Task = require('./models/Task');
    
    // Test creating a task directly
    const testTask = new Task({
      text: 'Test task from backend script',
      date: new Date().toISOString(),
      user: null // Test without user first
    });

    const savedTask = await testTask.save();
    console.log('✅ Task created successfully:', savedTask);

    // Test with a fake user ID
    const testTaskWithUser = new Task({
      text: 'Test task with user',
      date: new Date().toISOString(),
      user: new mongoose.Types.ObjectId() // Fake user ID
    });

    const savedTaskWithUser = await testTaskWithUser.save();
    console.log('✅ Task with user created successfully:', savedTaskWithUser);

    // Clean up test tasks
    await Task.deleteMany({ text: { $regex: /^Test task/ } });
    console.log('✅ Test tasks cleaned up');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTaskCreation();