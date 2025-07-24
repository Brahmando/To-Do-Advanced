const mongoose = require('mongoose');

const userContextCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cachedData: {
    taskSummary: {
      totalTasks: { type: Number, default: 0 },
      activeTasks: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
      deletedTasks: { type: Number, default: 0 },
      overdueTasks: { type: Number, default: 0 },
      todayTasks: { type: Number, default: 0 },
      thisWeekTasks: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    groupSummary: {
      totalGroups: { type: Number, default: 0 },
      activeGroups: { type: Number, default: 0 },
      sharedGroups: { type: Number, default: 0 },
      ownedSharedGroups: { type: Number, default: 0 },
      memberSharedGroups: { type: Number, default: 0 },
      recentGroupActivity: [{ 
        groupId: mongoose.Schema.Types.ObjectId,
        groupName: String,
        activity: String,
        timestamp: Date
      }],
      lastUpdated: { type: Date, default: Date.now }
    },
    notificationSummary: {
      unreadCount: { type: Number, default: 0 },
      totalNotifications: { type: Number, default: 0 },
      recentNotifications: [{
        type: String,
        message: String,
        timestamp: Date,
        read: Boolean
      }],
      lastUpdated: { type: Date, default: Date.now }
    },
    productivityMetrics: {
      dailyCompletionAverage: { type: Number, default: 0 },
      weeklyCompletionAverage: { type: Number, default: 0 },
      mostProductiveDay: { type: String, default: null },
      streakDays: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  cacheExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes default
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient cache cleanup (userId already has unique index)
userContextCacheSchema.index({ cacheExpiry: 1 });

// Update updatedAt on save
userContextCacheSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if cache is expired
userContextCacheSchema.methods.isExpired = function() {
  return new Date() > this.cacheExpiry;
};

// Method to refresh cache expiry
userContextCacheSchema.methods.refreshExpiry = function(minutes = 15) {
  this.cacheExpiry = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

const UserContextCache = mongoose.model('UserContextCache', userContextCacheSchema);

module.exports = UserContextCache;