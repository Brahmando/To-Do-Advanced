const mongoose = require('mongoose');

const aiChatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  intent: {
    type: String,
    default: null // recognized intent for user messages
  },
  dataContext: {
    type: mongoose.Schema.Types.Mixed,
    default: null // relevant data used for assistant responses
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const aiChatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [aiChatMessageSchema],
  sessionStart: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for efficient querying
aiChatSessionSchema.index({ userId: 1, lastActivity: -1 });
aiChatSessionSchema.index({ userId: 1, isActive: 1 });

// Update lastActivity on message addition
aiChatSessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

const AiChatSession = mongoose.model('AiChatSession', aiChatSessionSchema);

module.exports = AiChatSession;