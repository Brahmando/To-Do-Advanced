const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { aiChatbotAuth, sanitizeInput, validateSession } = require('../middleware/aiChatbotAuth');

const { 
  processUserQuery, 
  getChatHistory, 
  clearChatHistory 
} = require('../services/aiChatbotService');
const { performanceMonitor, cacheMiddleware } = require('../services/cacheService');

// Rate limiting for AI chatbot endpoints
const chatbotRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each user to 30 requests per minute
  message: {
    error: 'Too many requests to AI chatbot. Please wait a moment before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Let express-rate-limit handle IP addresses properly (including IPv6)
  // No custom keyGenerator needed - it will use req.ip with proper IPv6 support
  skip: (req) => {
    // Skip rate limiting for authenticated users with valid sessions
    return req.user && req.user.id && req.session && req.session.userId;
  }
});

// Input validation middleware
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .escape(), // Sanitize HTML
];

/**
 * POST /api/ai-chatbot/chat
 * Process user message and return AI response
 */
router.post('/chat', aiChatbotAuth, sanitizeInput, validateSession, chatbotRateLimit, validateChatMessage, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: errors.array()
      });
    }

    const { message } = req.body;
    const userId = req.user.id;

    // Process the user query
    const result = await processUserQuery(userId, message);

    res.json({
      success: true,
      data: {
        response: result.response,
        intent: result.intent,
        confidence: result.confidence,
        sessionId: result.sessionId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Chatbot chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing your message',
      message: 'Please try again in a moment'
    });
  }
});

/**
 * GET /api/ai-chatbot/history
 * Retrieve chat history for the authenticated user
 */
router.get('/history', aiChatbotAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    // Validate limit parameter
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100'
      });
    }

    const history = await getChatHistory(userId, limit);

    res.json({
      success: true,
      data: {
        messages: history,
        count: history.length,
        userId: userId
      }
    });

  } catch (error) {
    console.error('AI Chatbot history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving chat history'
    });
  }
});

/**
 * DELETE /api/ai-chatbot/history
 * Clear chat history for the authenticated user
 */
router.delete('/history', aiChatbotAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const success = await clearChatHistory(userId);

    if (success) {
      res.json({
        success: true,
        message: 'Chat history cleared successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to clear chat history'
      });
    }

  } catch (error) {
    console.error('AI Chatbot clear history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while clearing chat history'
    });
  }
});

/**
 * GET /api/ai-chatbot/status
 * Get AI chatbot service status and capabilities
 */
router.get('/status', aiChatbotAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'active',
        capabilities: [
          'Task status and management',
          'Group information and activities',
          'Notification management',
          'Productivity insights',
          'Account overview',
          'Natural language queries'
        ],
        supportedIntents: [
          'TASK_STATUS',
          'TASK_DETAILS',
          'TASK_STATISTICS',
          'GROUP_INFO',
          'GROUP_TASKS',
          'NOTIFICATIONS',
          'ACCOUNT_OVERVIEW',
          'PRODUCTIVITY_INSIGHTS',
          'HELP'
        ],
        version: '1.0.0',
        rateLimit: {
          requests: 30,
          windowMs: 60000,
          message: 'Requests per minute limit'
        }
      }
    });
  } catch (error) {
    console.error('AI Chatbot status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while getting status'
    });
  }
});

/**
 * GET /api/ai-chatbot/help
 * Get help information and example queries
 */
router.get('/help', aiChatbotAuth, cacheMiddleware(600), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        title: 'Task Buddy AI Assistant Help',
        description: 'I can help you with information about your tasks, groups, notifications, and productivity.',
        examples: {
          tasks: [
            'How many tasks do I have?',
            'Show me my pending tasks',
            'What\'s my completion rate?',
            'Any overdue tasks?'
          ],
          groups: [
            'What groups am I in?',
            'Show me group tasks',
            'Who are my group members?',
            'Group activity summary'
          ],
          notifications: [
            'Any unread notifications?',
            'Show me recent alerts',
            'Notification summary'
          ],
          productivity: [
            'Show me productivity insights',
            'How\'s my performance?',
            'Productivity trends',
            'My most productive day'
          ],
          account: [
            'Account overview',
            'My profile summary',
            'Account statistics'
          ]
        },
        tips: [
          'Ask questions in natural language',
          'Be specific about what information you need',
          'Use follow-up questions for more details',
          'Type "help" anytime for assistance'
        ]
      }
    });
  } catch (error) {
    console.error('AI Chatbot help error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while getting help'
    });
  }
});

/**
 * GET /api/ai-chatbot/performance
 * Get performance metrics and cache statistics (admin/debug endpoint)
 */
router.get('/performance', aiChatbotAuth, async (req, res) => {
  try {
    const stats = performanceMonitor.getStats();
    
    res.json({
      success: true,
      data: {
        performance: stats,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error('AI Chatbot performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while getting performance metrics'
    });
  }
});

module.exports = router;