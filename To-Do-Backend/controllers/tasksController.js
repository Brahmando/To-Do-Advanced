const Task = require('../models/Task');
const User = require('../models/User');

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    // Use user data from auth middleware
    if (req.user && req.user.userId) {
      // For logged-in users, get tasks by user ID
      const tasks = await Task.find({ user: req.user.userId });
      res.json(tasks);
    } else {
      // For guest users, return empty array (client will handle localStorage)
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { text, date, groupId } = req.body;

    const task = new Task({
      text,
      date,
      user: req.user && req.user.userId ? req.user.userId : null,
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
    if (req.user && req.user.userId) {
      await User.findByIdAndUpdate(req.user.userId, {
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
    if (req.user && req.user.userId) {
      await User.findByIdAndUpdate(req.user.userId, {
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
    if (req.user && req.user.userId) {
      await User.findByIdAndUpdate(req.user.userId, {
        $pull: { completedTasks: id },
        $push: { activeTasks: id }
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};