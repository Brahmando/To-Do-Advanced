const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for guest users
  },
  created: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;