const express = require('express');
const router = express.Router();
const { aiChatbotAuth } = require('../middleware/aiChatbotAuth');
const AiChatSession = require('../models/AiChatSession');

/**
 * GET /api/ai-chatbot/analytics
 * Get user's chatbot usage analytics
 */
router.get('/analytics', aiChatbotAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's chat sessions
    const sessions = await AiChatSession.find({ userId }).lean();
    
    if (sessions.length === 0) {
      return res.json({
        success: true,
        data: {
          totalSessions: 0,
          totalMessages: 0,
          mostUsedIntents: {},
          averageSessionLength: 0,
          lastChatDate: null
        }
      });
    }
    
    // Calculate analytics
    let totalMessages = 0;
    const intentCounts = {};
    let totalSessionDuration = 0;
    let lastChatDate = null;
    
    sessions.forEach(session => {
      totalMessages += session.messages.length;
      
      // Count intents
      session.messages.forEach(message => {
        if (message.intent) {
          intentCounts[message.intent] = (intentCounts[message.intent] || 0) + 1;
        }
      });
      
      // Calculate session duration
      if (session.messages.length > 1) {
        const firstMsg = new Date(session.messages[0].timestamp);
        const lastMsg = new Date(session.messages[session.messages.length - 1].timestamp);
        totalSessionDuration += (lastMsg - firstMsg);
      }
      
      // Track last chat date
      if (!lastChatDate || session.lastActivity > lastChatDate) {
        lastChatDate = session.lastActivity;
      }
    });
    
    // Sort intents by usage
    const sortedIntents = Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [intent, count]) => {
        obj[intent] = count;
        return obj;
      }, {});
    
    const averageSessionLength = sessions.length > 0 ? 
      totalSessionDuration / sessions.length : 0;
    
    res.json({
      success: true,
      data: {
        totalSessions: sessions.length,
        totalMessages,
        mostUsedIntents: sortedIntents,
        averageSessionLength: Math.round(averageSessionLength / 1000), // Convert to seconds
        lastChatDate,
        userMessages: sessions.reduce((sum, s) => sum + s.messages.filter(m => m.role === 'user').length, 0),
        assistantMessages: sessions.reduce((sum, s) => sum + s.messages.filter(m => m.role === 'assistant').length, 0)
      }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

module.exports = router;