const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure indexes are created
const AiChatSession = require('../models/AiChatSession');
const UserContextCache = require('../models/UserContextCache');

async function setupIndexes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is required');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create indexes for AiChatSession
    await AiChatSession.createIndexes();
    console.log('✅ AiChatSession indexes created');

    // Create indexes for UserContextCache
    await UserContextCache.createIndexes();
    console.log('✅ UserContextCache indexes created');

    // Additional performance indexes for existing models used by AI chatbot
    const db = mongoose.connection.db;
    
    // Task model indexes for AI queries
    await db.collection('tasks').createIndex({ user: 1, completed: 1, deleted: 1 });
    await db.collection('tasks').createIndex({ user: 1, date: 1 });
    await db.collection('tasks').createIndex({ user: 1, created: -1 });
    console.log('✅ Task collection indexes optimized for AI queries');

    // Group model indexes for AI queries
    await db.collection('groups').createIndex({ user: 1, deleted: 1 });
    await db.collection('groups').createIndex({ user: 1, completed: 1 });
    console.log('✅ Group collection indexes optimized for AI queries');

    // SharedGroup model indexes for AI queries
    await db.collection('sharedgroups').createIndex({ 'members.user': 1 });
    await db.collection('sharedgroups').createIndex({ owner: 1 });
    await db.collection('sharedgroups').createIndex({ 'members.user': 1, lastActivity: -1 });
    console.log('✅ SharedGroup collection indexes optimized for AI queries');

    console.log('🚀 All AI Chatbot database indexes setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  setupIndexes();
}

module.exports = setupIndexes;