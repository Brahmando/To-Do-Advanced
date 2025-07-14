
const express = require('express');
const Group = require('../models/Group');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all groups for user
router.get('/', auth, async (req, res) => {
  console.log('Received request to get groups for user:', req.user.userId);    
  try {
    const groups = await Group.find({ 
      user: req.user?.userId || null,
      deleted: false 
    }).populate('tasks');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new group
router.post('/', auth, async (req, res) => {
  console.log('hello boss')
  try {
    const { name, taskText, taskDate } = req.body;
    const user = req.user ? req.user.userId : null;

    // Create the group
    const existingGroup=await Group.findOne({name})
    console.log('Existing group:', existingGroup)
    if(existingGroup){
      console.log('entering here')

      const task = new Task({
        text: taskText,
        date: taskDate,
        group: existingGroup._id  // Associate task with the new group
      });

      const savedTask = await task.save();
      existingGroup.tasks.push(savedTask._id);
      await existingGroup.save(); // Save the updated group
      res.status(201).json({ group: existingGroup, task: savedTask });
    }else{
      console.log('Creating group with data:', { name, user, taskText, taskDate })
      const group = new Group({ name, user });
      const savedGroup = await group.save();  // Save the group to get its ID

      // Create the task and associate it with the group if taskText is provided
      if (taskText && taskDate) {
        const task = new Task({
          text: taskText,
          date: taskDate,
          group: savedGroup._id  // Associate task with the new group
        });

        const savedTask = await task.save();

        // Now update the group's tasks array to include the new task ID
        savedGroup.tasks.push(savedTask._id); // Push the new task ID into the group's tasks array
        await savedGroup.save(); // Save the updated group

        res.status(201).json({ group: savedGroup, task: savedTask });
      } else {
        res.status(201).json({ group: savedGroup });
      }
    }

    
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
