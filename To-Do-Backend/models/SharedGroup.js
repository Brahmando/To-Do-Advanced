
const mongoose = require('mongoose');
const Task = require('./Task');

const changeLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  commitMessage: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'collaborator', 'medium', 'observer'],
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const joinRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  requestedRole: {
    type: String,
    enum: ['collaborator', 'medium'],
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  dismissed: {
    type: Boolean,
    default: false
  },
  dismissedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const sharedGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accessKey: {
    type: String,
    required: function() {
      return !this.isPublic;
    }
  },
  tasks: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    text: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByName: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    order: {
      type: Number,
      default: 0
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  members: [memberSchema],
  joinRequests: [joinRequestSchema],
  changeLog: [changeLogSchema],
  totalChanges: {
    type: Number,
    default: 0
  },
  created: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Index for searching public groups
sharedGroupSchema.index({ name: 'text', isPublic: 1 });

const SharedGroup = mongoose.model('SharedGroup', sharedGroupSchema);

module.exports = SharedGroup;
