const express = require('express');
const router = express.Router();
const Task = require('../models/Task'); // Assuming your model is in models/Task.js
const auth = require('../middleware/auth');
const {
  createTask,
  getTasks,
  completeTask,
  deleteTask,
  undoTask
} = require('../controllers/tasksController'); // Corrected import path

// POST /api/tasks
router.post('/', auth, createTask);

// GET /api/tasks
router.get('/', auth, getTasks);

// PUT /api/tasks/:id/complete
router.put('/:id/complete', auth, completeTask);

// PUT /api/tasks/:id/undo
router.put('/:id/undo', auth, undoTask); 

// DELETE /api/tasks/:id
router.delete('/:id', auth, deleteTask);

// Edit task
router.put('/:id', auth, async (req, res) => {
  try {
    const { text, date } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { 
        text: text || undefined, 
        date: date || undefined 
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;