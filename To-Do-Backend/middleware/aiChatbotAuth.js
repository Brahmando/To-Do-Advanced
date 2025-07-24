const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Enhanced authentication middleware specifically for AI Chatbot
 * Requires valid authentication and verified user
 */
const aiChatbotAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No valid token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if user exists and is verified
    const user = await User.findById(decoded.userId).select('-password -emailVerificationOTP');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user's email is verified (required for AI chatbot access)
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required to access AI assistant.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Attach user information to request
    req.user = {
      id: user._id,
      userId: user._id, // For compatibility
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    };

    next();
  } catch (error) {
    console.error('AI Chatbot authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Input sanitization middleware for AI chatbot
 */
const sanitizeInput = (req, res, next) => {
  if (req.body.message) {
    // Remove potentially harmful characters and limit length
    req.body.message = req.body.message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim()
      .substring(0, 1000); // Limit to 1000 characters
  }
  next();
};

/**
 * Session validation middleware
 */
const validateSession = async (req, res, next) => {
  try {
    // Check if user has exceeded daily message limit (optional)
    const dailyLimit = process.env.AI_CHATBOT_DAILY_LIMIT || 500;
    
    // This could be enhanced with Redis or database tracking
    // For now, we'll rely on rate limiting
    
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Session validation failed.',
      code: 'SESSION_ERROR'
    });
  }
};

module.exports = {
  aiChatbotAuth,
  sanitizeInput,
  validateSession
};