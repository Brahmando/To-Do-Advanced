const AiChatSession = require('../models/AiChatSession');
const UserContextCache = require('../models/UserContextCache');

/**
 * Initialize AI Chatbot database setup
 * This function ensures all necessary indexes are created
 */
async function initializeAiChatbotDb() {
  try {
    // Create indexes for AI Chat models
    await AiChatSession.createIndexes();
    await UserContextCache.createIndexes();
    
    console.log('✅ AI Chatbot database indexes initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing AI Chatbot database:', error);
    return false;
  }
}

module.exports = {
  initializeAiChatbotDb
};