
const express = require('express');
const Group = require('../models/Group');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all groups for user
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ 
      user: req.user?.id || null,
      deleted: false 
    }).populate('tasks');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new group
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const group = new Group({
      name,
      user: req.user?.id || null
    });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete a group (mark all tasks as completed)
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('tasks');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if all tasks are completed
    const allTasksCompleted = group.tasks.every(task => task.completed);
    if (!allTasksCompleted) {
      return res.status(400).json({ error: 'Cannot complete group until all tasks are completed' });
    }

    group.completed = true;
    group.completedAt = new Date();
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a group
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    group.deleted = true;
    group.deletedAt = new Date();
    await group.save();

    // Also mark all tasks in the group as deleted
    await Task.updateMany(
      { group: req.params.id },
      { deleted: true, deletedAt: new Date() }
    );

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
