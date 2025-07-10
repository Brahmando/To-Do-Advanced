const Task = require('../models/Task');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to get user from token (optional for guest mode)
const getUser = async (req) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    return await User.findById(decoded.userId);
  } catch (error) {
    return null;
  }
};

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const user = await getUser(req);
    let tasks;

    if (user) {
      // For logged-in users, get tasks by user ID
      tasks = await Task.find({ user: user._id });
    } else {
      // For guest users, return empty array (client will handle localStorage)
      tasks = [];
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { text, date, groupId } = req.body;
    const user = await getUser(req);

    const task = new Task({
      text,
      date,
      user: user ? user._id : null,
      group: groupId || null
    });

    const savedTask = await task.save();

    // If task belongs to a group, add it to the group's tasks array
    if (groupId) {
      const Group = require('../models/Group');
      await Group.findByIdAndUpdate(groupId, {
        $push: { tasks: savedTask._id }
      });
    }

    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Complete a task
exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUser(req);

    const task = await Task.findByIdAndUpdate(
      id,
      { 
        completed: true, 
        completedAt: new Date() 
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If user is logged in, move task from activeTasks to completedTasks
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        $pull: { activeTasks: id },
        $push: { completedTasks: id }
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUser(req);

    const task = await Task.findByIdAndUpdate(
      id,
      { 
        deleted: true, 
        deletedAt: new Date() 
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If user is logged in, move task to deletedTasks array
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        $pull: { activeTasks: id, completedTasks: id },
        $push: { deletedTasks: id }
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Undo a task (move from completed back to active)
exports.undoTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUser(req);

    const task = await Task.findByIdAndUpdate(
      id,
      { 
        completed: false, 
        completedAt: null 
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If user is logged in, move task from completedTasks to activeTasks
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        $pull: { completedTasks: id },
        $push: { activeTasks: id }
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};