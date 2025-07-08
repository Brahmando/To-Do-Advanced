const express = require('express');
const router = express.Router();
const Task = require('../models/Task'); // Assuming your model is in models/Task.js
const {
  createTask,
  getTasks,
  completeTask,
  deleteTask,
  undoTask
} = require('../controllers/tasksController'); // Corrected import path

// POST /api/tasks
router.post('/', createTask);

// GET /api/tasks
router.get('/', getTasks);

// PUT /api/tasks/:id/complete
router.put('/:id/complete', completeTask);

// PUT /api/tasks/:id/undo
router.put('/:id/undo', undoTask); 

// DELETE /api/tasks/:id
router.delete('/:id', deleteTask);

module.exports = router;