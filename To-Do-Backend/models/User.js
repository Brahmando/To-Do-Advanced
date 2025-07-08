
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  activeTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  completedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  deletedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
