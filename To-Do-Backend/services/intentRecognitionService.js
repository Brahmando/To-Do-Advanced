/**
 * Intent Recognition Service
 * Uses rule-based pattern matching to identify user intent from natural language queries
 */

// Intent types
const INTENT_TYPES = {
  TASK_STATUS: 'TASK_STATUS',
  TASK_DETAILS: 'TASK_DETAILS', 
  TASK_STATISTICS: 'TASK_STATISTICS',
  OVERDUE_TASKS: 'OVERDUE_TASKS',
  GROUP_INFO: 'GROUP_INFO',
  GROUP_TASKS: 'GROUP_TASKS',
  SHARED_GROUP_TASKS: 'SHARED_GROUP_TASKS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  ACCOUNT_OVERVIEW: 'ACCOUNT_OVERVIEW',
  PRODUCTIVITY_INSIGHTS: 'PRODUCTIVITY_INSIGHTS',
  GREETING: 'GREETING',
  DATE_TIME: 'DATE_TIME',
  MOTIVATION: 'MOTIVATION',
  SMALL_TALK: 'SMALL_TALK',
  HELP: 'HELP',
  UNKNOWN: 'UNKNOWN'
};

// Keyword patterns for each intent
const INTENT_PATTERNS = {
  [INTENT_TYPES.TASK_STATUS]: {
    keywords: ['task', 'tasks', 'pending', 'active', 'completed', 'done', 'finished', 'status', 'progress'],
    phrases: ['how many tasks', 'task status', 'pending tasks', 'completed tasks', 'active tasks', 'my tasks'],
    weight: 1.0
  },
  [INTENT_TYPES.TASK_DETAILS]: {
    keywords: ['deadline', 'due', 'when', 'date', 'time', 'specific', 'details', 'info', 'information'],
    phrases: ['task details', 'when is', 'due date', 'deadline for', 'tell me about', 'task info'],
    weight: 1.0
  },
  [INTENT_TYPES.TASK_STATISTICS]: {
    keywords: ['statistics', 'stats', 'count', 'total', 'average', 'completion', 'rate', 'percentage', 'analytics'],
    phrases: ['task statistics', 'completion rate', 'how many', 'total tasks', 'task analytics', 'productivity stats'],
    weight: 1.0
  },
  [INTENT_TYPES.OVERDUE_TASKS]: {
    keywords: ['overdue', 'overdue tasks', 'late', 'late tasks', 'missed', 'past due', 'expired'],
    phrases: ['show me overdue tasks', 'overdue tasks', 'what tasks are overdue', 'late tasks', 'missed deadlines'],
    weight: 1.2
  },
  [INTENT_TYPES.GROUP_INFO]: {
    keywords: ['group', 'groups', 'team', 'members', 'member', 'role', 'owner', 'collaborator'],
    phrases: ['my groups', 'group members', 'what groups', 'group info', 'team members', 'group role'],
    weight: 1.0
  },
  [INTENT_TYPES.GROUP_TASKS]: {
    keywords: ['group task', 'group tasks', 'personal group', 'my group', 'group work', 'task group'],
    phrases: ['group tasks', 'my group tasks', 'personal group tasks', 'group task list', 'task groups'],
    weight: 1.0
  },
  [INTENT_TYPES.SHARED_GROUP_TASKS]: {
    keywords: ['shared group', 'shared task', 'team task', 'collaborative', 'shared work', 'collaboration'],
    phrases: ['shared group tasks', 'shared tasks', 'team tasks', 'collaborative tasks', 'shared group activities'],
    weight: 1.0
  },
  [INTENT_TYPES.NOTIFICATIONS]: {
    keywords: ['notification', 'notifications', 'alert', 'alerts', 'reminder', 'reminders', 'unread'],
    phrases: ['my notifications', 'unread notifications', 'recent notifications', 'notification settings'],
    weight: 1.0
  },
  [INTENT_TYPES.ACCOUNT_OVERVIEW]: {
    keywords: ['account', 'profile', 'overview', 'summary', 'dashboard', 'settings', 'preferences'],
    phrases: ['account overview', 'my account', 'account summary', 'profile info', 'account settings', 'my profile'],
    weight: 1.0
  },
  [INTENT_TYPES.PRODUCTIVITY_INSIGHTS]: {
    keywords: ['productivity', 'performance', 'insights', 'trends', 'patterns', 'analysis', 'metrics'],
    phrases: ['productivity insights', 'performance analysis', 'productivity trends', 'work patterns'],
    weight: 1.0
  },
  [INTENT_TYPES.GREETING]: {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy'],
    phrases: ['hi there', 'hello there', 'good morning', 'good afternoon', 'good evening', 'how are you', 'whats up'],
    weight: 1.2
  },
  [INTENT_TYPES.DATE_TIME]: {
    keywords: ['date', 'time', 'today', 'tomorrow', 'yesterday', 'day', 'month', 'year', 'week', 'calendar'],
    phrases: ['what date', 'what time', 'what day', 'todays date', 'current date', 'current time', 'which day', 'what month'],
    weight: 1.0
  },
  [INTENT_TYPES.MOTIVATION]: {
    keywords: ['motivation', 'motivate', 'inspire', 'encourage', 'boost', 'energy', 'focus', 'productive'],
    phrases: ['motivate me', 'inspire me', 'need motivation', 'feeling lazy', 'boost my energy', 'help me focus'],
    weight: 1.0
  },
  [INTENT_TYPES.SMALL_TALK]: {
    keywords: ['thanks', 'thank you', 'awesome', 'great', 'cool', 'nice', 'good job', 'well done', 'bye', 'goodbye'],
    phrases: ['thank you', 'thanks a lot', 'thats great', 'thats awesome', 'good job', 'well done', 'see you later', 'goodbye'],
    weight: 1.0
  },
  [INTENT_TYPES.HELP]: {
    keywords: ['help', 'how', 'what can', 'commands', 'guide', 'tutorial', 'support', 'assistance'],
    phrases: ['help me', 'what can you do', 'how to', 'need help', 'show me', 'guide me'],
    weight: 1.0
  }
};

/**
 * Normalize text for better matching
 */
function normalizeText(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Calculate intent score based on keyword and phrase matching
 */
function calculateIntentScore(normalizedMessage, pattern) {
  let score = 0;
  let matches = 0;

  // Check keyword matches
  pattern.keywords.forEach(keyword => {
    if (normalizedMessage.includes(keyword)) {
      score += 1;
      matches++;
    }
  });

  // Check phrase matches (higher weight)
  pattern.phrases.forEach(phrase => {
    if (normalizedMessage.includes(phrase)) {
      score += 2;
      matches++;
    }
  });

  // Apply pattern weight
  score *= pattern.weight;

  return { score, matches };
}

/**
 * Recognize intent from user message with context support
 */
function recognizeIntent(message, context = {}) {
  if (!message || typeof message !== 'string') {
    return {
      intent: INTENT_TYPES.UNKNOWN,
      confidence: 0,
      matches: 0,
      alternatives: [],
      isFollowUp: false,
      compoundIntents: []
    };
  }

  const normalizedMessage = normalizeText(message);
  
  // Check for follow-up patterns
  const isFollowUp = detectFollowUpPattern(normalizedMessage, context);
  
  // Check for compound queries (multiple intents in one message)
  const compoundIntents = detectCompoundIntents(normalizedMessage);
  
  const intentScores = [];

  // Calculate scores for each intent
  Object.entries(INTENT_PATTERNS).forEach(([intent, pattern]) => {
    const { score, matches } = calculateIntentScore(normalizedMessage, pattern);
    if (score > 0) {
      intentScores.push({
        intent,
        score,
        matches,
        confidence: Math.min(score / 2, 1.0) // Normalize confidence to 0-1 (adjusted for better recognition)
      });
    }
  });

  // Boost confidence if this is a follow-up and matches previous context
  if (isFollowUp && context.previousIntent) {
    const contextMatch = intentScores.find(score => score.intent === context.previousIntent);
    if (contextMatch) {
      contextMatch.confidence = Math.min(contextMatch.confidence * 1.2, 1.0);
      contextMatch.score *= 1.2;
    }
  }

  // Sort by score descending
  intentScores.sort((a, b) => b.score - a.score);

  if (intentScores.length === 0) {
    return {
      intent: INTENT_TYPES.UNKNOWN,
      confidence: 0,
      matches: 0,
      alternatives: [],
      isFollowUp,
      compoundIntents
    };
  }

  const topIntent = intentScores[0];
  const alternatives = intentScores.slice(1, 3); // Top 2 alternatives

  return {
    intent: topIntent.intent,
    confidence: topIntent.confidence,
    matches: topIntent.matches,
    alternatives: alternatives.map(alt => ({
      intent: alt.intent,
      confidence: alt.confidence
    })),
    isFollowUp,
    compoundIntents
  };
}

/**
 * Detect follow-up patterns in user messages
 */
function detectFollowUpPattern(normalizedMessage, context) {
  const followUpPatterns = [
    'what about',
    'and what',
    'also',
    'tell me more',
    'more details',
    'anything else',
    'what else',
    'show me more',
    'continue',
    'go on',
    'more info',
    'elaborate'
  ];

  const hasFollowUpPattern = followUpPatterns.some(pattern => 
    normalizedMessage.includes(pattern)
  );

  // Also check if message is short and context-dependent
  const isShortContextual = normalizedMessage.length < 20 && context.previousIntent;

  return hasFollowUpPattern || isShortContextual;
}

/**
 * Detect compound intents (multiple intents in one message)
 */
function detectCompoundIntents(normalizedMessage) {
  const compoundIntents = [];
  
  // Split message by common conjunctions
  const conjunctions = ['and', 'also', 'plus', 'then', 'after that', 'next'];
  let messageParts = [normalizedMessage];
  
  conjunctions.forEach(conjunction => {
    const newParts = [];
    messageParts.forEach(part => {
      if (part.includes(conjunction)) {
        newParts.push(...part.split(conjunction).map(p => p.trim()));
      } else {
        newParts.push(part);
      }
    });
    messageParts = newParts;
  });

  // Analyze each part for intent
  messageParts.forEach(part => {
    if (part.length > 5) { // Ignore very short parts
      const intentScores = [];
      
      Object.entries(INTENT_PATTERNS).forEach(([intent, pattern]) => {
        const { score } = calculateIntentScore(part, pattern);
        if (score > 0) {
          intentScores.push({
            intent,
            score,
            confidence: Math.min(score / 3, 1.0),
            messagePart: part
          });
        }
      });

      if (intentScores.length > 0) {
        intentScores.sort((a, b) => b.score - a.score);
        compoundIntents.push(intentScores[0]);
      }
    }
  });

  return compoundIntents;
}

/**
 * Generate clarification questions for ambiguous queries
 */
function generateClarificationQuestion(intentResult, originalMessage) {
  if (intentResult.confidence > 0.7) {
    return null; // High confidence, no clarification needed
  }

  if (intentResult.alternatives.length === 0) {
    return "I'm not sure what you're asking about. Could you please rephrase your question or ask about tasks, groups, notifications, or productivity?";
  }

  const topAlternatives = intentResult.alternatives.slice(0, 2);
  let question = "I'm not entirely sure what you're looking for. Did you want to know about:\n";
  
  topAlternatives.forEach((alt, index) => {
    question += `${index + 1}. ${getIntentDescription(alt.intent)}\n`;
  });
  
  question += "\nPlease let me know which one interests you!";
  
  return question;
}

/**
 * Process date range queries
 */
function extractDateRange(message) {
  const datePatterns = {
    today: /today|this day/i,
    yesterday: /yesterday/i,
    thisWeek: /this week|current week/i,
    lastWeek: /last week|previous week/i,
    thisMonth: /this month|current month/i,
    lastMonth: /last month|previous month/i,
    last7Days: /last 7 days|past week/i,
    last30Days: /last 30 days|past month/i
  };

  const ranges = {};
  
  Object.entries(datePatterns).forEach(([range, pattern]) => {
    if (pattern.test(message)) {
      ranges[range] = true;
    }
  });

  return Object.keys(ranges).length > 0 ? ranges : null;
}

/**
 * Extract filters from user message
 */
function extractFilters(message) {
  const filters = {};
  
  // Status filters
  if (/completed|done|finished/i.test(message)) {
    filters.status = 'completed';
  } else if (/pending|active|incomplete|todo/i.test(message)) {
    filters.status = 'active';
  } else if (/overdue|late/i.test(message)) {
    filters.status = 'overdue';
  }
  
  // Priority filters
  if (/high priority|urgent|important/i.test(message)) {
    filters.priority = 'high';
  } else if (/low priority/i.test(message)) {
    filters.priority = 'low';
  }
  
  // Group filters
  const groupMatch = message.match(/group\s+["']([^"']+)["']|group\s+(\w+)/i);
  if (groupMatch) {
    filters.group = groupMatch[1] || groupMatch[2];
  }
  
  return Object.keys(filters).length > 0 ? filters : null;
}

/**
 * Get intent type constants
 */
function getIntentTypes() {
  return INTENT_TYPES;
}

/**
 * Check if intent is valid
 */
function isValidIntent(intent) {
  return Object.values(INTENT_TYPES).includes(intent);
}

/**
 * Get human-readable intent description
 */
function getIntentDescription(intent) {
  const descriptions = {
    [INTENT_TYPES.TASK_STATUS]: 'Questions about task completion status and progress',
    [INTENT_TYPES.TASK_DETAILS]: 'Requests for specific task information and details',
    [INTENT_TYPES.TASK_STATISTICS]: 'Queries about task statistics and analytics',
    [INTENT_TYPES.OVERDUE_TASKS]: 'Queries about overdue and late tasks',
    [INTENT_TYPES.GROUP_INFO]: 'Information about groups and team membership',
    [INTENT_TYPES.GROUP_TASKS]: 'Questions about personal group tasks and activities',
    [INTENT_TYPES.SHARED_GROUP_TASKS]: 'Questions about shared/collaborative group tasks',
    [INTENT_TYPES.NOTIFICATIONS]: 'Notification-related queries and management',
    [INTENT_TYPES.ACCOUNT_OVERVIEW]: 'General account information and settings',
    [INTENT_TYPES.PRODUCTIVITY_INSIGHTS]: 'Productivity analysis and performance insights',
    [INTENT_TYPES.GREETING]: 'Friendly greetings and hellos',
    [INTENT_TYPES.DATE_TIME]: 'Date and time related queries',
    [INTENT_TYPES.MOTIVATION]: 'Motivational support and encouragement',
    [INTENT_TYPES.SMALL_TALK]: 'Casual conversation and pleasantries',
    [INTENT_TYPES.HELP]: 'Help requests and guidance',
    [INTENT_TYPES.UNKNOWN]: 'Unrecognized or unclear intent'
  };

  return descriptions[intent] || 'Unknown intent type';
}

module.exports = {
  recognizeIntent,
  getIntentTypes,
  isValidIntent,
  getIntentDescription,
  generateClarificationQuestion,
  extractDateRange,
  extractFilters,
  detectFollowUpPattern,
  detectCompoundIntents,
  INTENT_TYPES
};