const crypto = require('crypto');

/**
 * Security utilities for AI Chatbot
 */

/**
 * Generate secure session ID
 */
function generateSessionId(userId) {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(`${userId}-${timestamp}-${randomBytes}`)
    .digest('hex');
  return hash.substring(0, 32);
}

/**
 * Validate and sanitize user input
 */
function sanitizeUserInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potentially dangerous characters
    .replace(/[<>'"&]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Trim and limit length
    .trim()
    .substring(0, 1000);
}

/**
 * Check for suspicious patterns in user input
 */
function detectSuspiciousPatterns(input) {
  const suspiciousPatterns = [
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i,
    /alert\(/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limiting helper - check if user has exceeded limits
 */
const userRequestCounts = new Map();

function checkRateLimit(userId, windowMs = 60000, maxRequests = 30) {
  const now = Date.now();
  const userKey = userId.toString();
  
  if (!userRequestCounts.has(userKey)) {
    userRequestCounts.set(userKey, []);
  }
  
  const requests = userRequestCounts.get(userKey);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    return {
      allowed: false,
      resetTime: Math.min(...validRequests) + windowMs,
      remainingRequests: 0
    };
  }
  
  // Add current request
  validRequests.push(now);
  userRequestCounts.set(userKey, validRequests);
  
  return {
    allowed: true,
    resetTime: now + windowMs,
    remainingRequests: maxRequests - validRequests.length
  };
}

/**
 * Clean up old rate limit data
 */
function cleanupRateLimitData() {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  for (const [userId, requests] of userRequestCounts.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    if (validRequests.length === 0) {
      userRequestCounts.delete(userId);
    } else {
      userRequestCounts.set(userId, validRequests);
    }
  }
}

// Clean up rate limit data every 5 minutes
setInterval(cleanupRateLimitData, 5 * 60 * 1000);

/**
 * Validate user permissions for AI chatbot access
 */
async function validateUserPermissions(user) {
  // Check if user is verified
  if (!user.isEmailVerified) {
    return {
      allowed: false,
      reason: 'Email verification required'
    };
  }

  // Check if user account is active (not suspended)
  // This could be extended with additional checks
  
  return {
    allowed: true,
    reason: 'Access granted'
  };
}

/**
 * Log security events
 */
function logSecurityEvent(event, userId, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId,
    details,
    ip: details.ip || 'unknown'
  };
  
  console.log('🔒 Security Event:', JSON.stringify(logEntry));
  
  // In production, you might want to send this to a security monitoring service
  // or store in a dedicated security log database
}

/**
 * Generate content security policy for responses
 */
function generateCSPHeader() {
  return "default-src 'self'; script-src 'none'; object-src 'none'; style-src 'self' 'unsafe-inline';";
}

module.exports = {
  generateSessionId,
  sanitizeUserInput,
  detectSuspiciousPatterns,
  checkRateLimit,
  validateUserPermissions,
  logSecurityEvent,
  generateCSPHeader
};