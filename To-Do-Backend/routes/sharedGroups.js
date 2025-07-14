
const express = require('express');
const SharedGroup = require('../models/SharedGroup');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all shared groups for user (as member or owner)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const groups = await SharedGroup.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).sort({ lastActivity: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search public groups
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    const groups = await SharedGroup.find({
      isPublic: true,
      name: { $regex: query, $options: 'i' }
    }).select('name description owner ownerName members totalChanges created')
      .limit(20);

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this route for user notifications
router.get('/user-notifications', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all shared groups where user is a member
    const userGroups = await SharedGroup.find({
      'members.user': userId
    }).populate('members.user', 'name');

    const notifications = [];

    for (const group of userGroups) {
      // Check for pending join requests if user is owner
      const userMember = group.members.find(m => m.user._id.toString() === userId);
      if (userMember && userMember.role === 'owner' && group.joinRequests) {
        for (const request of group.joinRequests) {
          if (request.status === 'pending') {
            notifications.push({
              type: 'join_request',
              groupId: group._id,
              groupName: group.name,
              requestId: request._id,
              userId: request.user,
              userName: request.userName,
              requestedRole: request.requestedRole,
              message: request.message,
              createdAt: request.createdAt
            });
          }
        }
      }

      // Check for request status updates if user made requests
      if (group.joinRequests) {
        for (const request of group.joinRequests) {
          if (request.user.toString() === userId && request.status !== 'pending') {
            notifications.push({
              type: 'request_update',
              groupId: group._id,
              groupName: group.name,
              status: request.status,
              createdAt: request.updatedAt || request.createdAt
            });
          }
        }
      }
    }

    // Sort by most recent
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific shared group
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const group = await SharedGroup.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user has access
    const hasAccess = group.owner.toString() === userId || 
                      group.members.some(member => member.user.toString() === userId) ||
                      group.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new shared group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPublic, accessKey } = req.body;
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if name already exists
    const existingGroup = await SharedGroup.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    const group = new SharedGroup({
      name,
      description,
      owner: userId,
      ownerName: user.name,
      isPublic,
      accessKey: isPublic ? undefined : accessKey,
      members: [{
        user: userId,
        userName: user.name,
        role: 'owner'
      }]
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { accessKey, role = 'observer' } = req.body;
    const userId = req.user.userId;
    const groupId = req.params.id;
    
    const user = await User.findById(userId);
    const group = await SharedGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is already a member
    const existingMember = group.members.find(member => member.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // For private groups, check access key
    if (!group.isPublic && group.accessKey !== accessKey) {
      return res.status(403).json({ error: 'Invalid access key' });
    }

    // For public groups or observer role, join immediately
    if (group.isPublic && role === 'observer') {
      group.members.push({
        user: userId,
        userName: user.name,
        role: 'observer'
      });
      
      group.changeLog.push({
        user: userId,
        userName: user.name,
        action: 'joined',
        commitMessage: `${user.name} joined the group as observer`
      });
      
      group.totalChanges += 1;
      group.lastActivity = new Date();
      
      await group.save();
      return res.json({ message: 'Successfully joined the group' });
    }

    // For collaborator or medium access, create join request
    if (role === 'collaborator' || role === 'medium') {
      const existingRequest = group.joinRequests.find(
        request => request.user.toString() === userId && request.status === 'pending'
      );
      
      if (existingRequest) {
        return res.status(400).json({ error: 'Join request already pending' });
      }
      
      group.joinRequests.push({
        user: userId,
        userName: user.name,
        requestedRole: role,
        message: req.body.message || ''
      });
      
      await group.save();
      return res.json({ message: 'Join request submitted successfully' });
    }

    res.status(400).json({ error: 'Invalid role specified' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle join request (approve/reject)
router.put('/:id/join-request/:requestId', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.user.userId;
    const { id: groupId, requestId } = req.params;
    
    const group = await SharedGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is owner
    if (group.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Only group owner can handle join requests' });
    }

    const requestIndex = group.joinRequests.findIndex(
      request => request._id.toString() === requestId && request.status === 'pending'
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    const joinRequest = group.joinRequests[requestIndex];
    
    if (action === 'approve') {
      // Add user to members
      group.members.push({
        user: joinRequest.user,
        userName: joinRequest.userName,
        role: joinRequest.requestedRole
      });
      
      // Add to change log
      group.changeLog.push({
        user: userId,
        userName: group.ownerName,
        action: 'approved_join_request',
        commitMessage: `Approved ${joinRequest.userName} as ${joinRequest.requestedRole}`
      });
      
      joinRequest.status = 'approved';
      group.totalChanges += 1;
    } else {
      joinRequest.status = 'rejected';
    }
    
    group.lastActivity = new Date();
    await group.save();
    
    res.json({ message: `Join request ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add task to shared group
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const { text, date, commitMessage } = req.body;
    const userId = req.user.userId;
    const groupId = req.params.id;
    
    const user = await User.findById(userId);
    const group = await SharedGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check permissions
    const member = group.members.find(m => m.user.toString() === userId);
    if (!member || member.role === 'observer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const newTask = {
      text,
      date,
      createdBy: userId,
      createdByName: user.name,
      order: group.tasks.length
    };

    group.tasks.push(newTask);
    
    group.changeLog.push({
      user: userId,
      userName: user.name,
      action: 'added_task',
      commitMessage: commitMessage || `Added task: ${text}`
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task in shared group
router.put('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const { text, date, commitMessage } = req.body;
    const userId = req.user.userId;
    const { id: groupId, taskId } = req.params;
    
    const user = await User.findById(userId);
    const group = await SharedGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const member = group.members.find(m => m.user.toString() === userId);
    if (!member || member.role === 'observer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const taskIndex = group.tasks.findIndex(t => t._id.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = group.tasks[taskIndex];
    
    // Check if user can edit this task
    if (member.role === 'medium' && task.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Medium access users can only edit their own tasks' });
    }

    task.text = text || task.text;
    task.date = date || task.date;
    
    group.changeLog.push({
      user: userId,
      userName: user.name,
      action: 'updated_task',
      commitMessage: commitMessage || `Updated task: ${task.text}`
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete task in shared group
router.put('/:id/tasks/:taskId/complete', auth, async (req, res) => {
  try {
    const { commitMessage } = req.body;
    const userId = req.user.userId;
    const { id: groupId, taskId } = req.params;
    
    const user = await User.findById(userId);
    const group = await SharedGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const member = group.members.find(m => m.user.toString() === userId);
    if (!member || member.role === 'observer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const taskIndex = group.tasks.findIndex(t => t._id.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = group.tasks[taskIndex];
    task.completed = true;
    task.completedAt = new Date();
    task.completedBy = userId;
    
    group.changeLog.push({
      user: userId,
      userName: user.name,
      action: 'completed_task',
      commitMessage: commitMessage || `Completed task: ${task.text}`
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task from shared group
router.delete('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const { commitMessage } = req.body;
    const userId = req.user.userId;
    const { id: groupId, taskId } = req.params;
    
    const user = await User.findById(userId);
    const group = await SharedGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const member = group.members.find(m => m.user.toString() === userId);
    if (!member || member.role === 'observer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const taskIndex = group.tasks.findIndex(t => t._id.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = group.tasks[taskIndex];
    
    // Check permissions for deletion
    if (member.role !== 'owner' && member.role !== 'collaborator') {
      return res.status(403).json({ error: 'Only owners and collaborators can delete tasks' });
    }

    task.deleted = true;
    task.deletedAt = new Date();
    task.deletedBy = userId;
    
    group.changeLog.push({
      user: userId,
      userName: user.name,
      action: 'deleted_task',
      commitMessage: commitMessage || `Deleted task: ${task.text}`
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder tasks
router.put('/:id/reorder', auth, async (req, res) => {
  try {
    const { taskIds, commitMessage } = req.body;
    const userId = req.user.userId;
    const groupId = req.params.id;
    
    const user = await User.findById(userId);
    const group = await SharedGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const member = group.members.find(m => m.user.toString() === userId);
    if (!member || member.role === 'observer') {
      return res.status(403).json({ error: 'Insufficient permissions to reorder tasks' });
    }

    // Update task orders
    taskIds.forEach((taskId, index) => {
      const task = group.tasks.find(t => t._id.toString() === taskId);
      if (task) {
        task.order = index;
      }
    });

    group.changeLog.push({
      user: userId,
      userName: user.name,
      action: 'reordered_tasks',
      commitMessage: commitMessage || 'Reordered tasks'
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for user (join requests for owned groups)
router.get('/notifications/requests', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const groups = await SharedGroup.find({
      owner: userId,
      'joinRequests.status': 'pending'
    }).select('name joinRequests');

    const notifications = [];
    groups.forEach(group => {
      group.joinRequests.forEach(request => {
        if (request.status === 'pending') {
          notifications.push({
            groupId: group._id,
            groupName: group.name,
            requestId: request._id,
            userName: request.userName,
            requestedRole: request.requestedRole,
            message: request.message,
            createdAt: request.createdAt
          });
        }
      });
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
// Add this route after the existing POST route
router.post('/from-group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isPublic, accessKey } = req.body;
    const userId = req.user.userId;

    // Get the original group
    const originalGroup = await Group.findById(groupId).populate('tasks');
    if (!originalGroup || originalGroup.user.toString() !== userId) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    // Check if shared group name already exists
    const existingSharedGroup = await SharedGroup.findOne({ name });
    if (existingSharedGroup) {
      return res.status(400).json({ error: 'Shared group name already exists' });
    }

    // Create the shared group
    const sharedGroup = new SharedGroup({
      name,
      description,
      owner: userId,
      isPublic,
      accessKey: isPublic ? undefined : accessKey,
      members: [{
        user: userId,
        role: 'owner',
        joinedAt: new Date()
      }],
      tasks: [],
      changeLog: [{
        action: 'GROUP_CREATED',
        user: userId,
        userName: req.user.name,
        commitMessage: `Created shared group from existing group: ${originalGroup.name}`,
        timestamp: new Date()
      }]
    });

    const savedSharedGroup = await sharedGroup.save();

    // Copy tasks from original group
    for (const originalTask of originalGroup.tasks) {
      if (!originalTask.deleted) {
        const newTask = new Task({
          text: originalTask.text,
          date: originalTask.date,
          group: savedSharedGroup._id,
          completed: originalTask.completed,
          completedAt: originalTask.completedAt,
          createdBy: userId,
          createdByName: req.user.name,
          created: originalTask.created || new Date()
        });

        const savedTask = await newTask.save();
        savedSharedGroup.tasks.push(savedTask._id);
      }
    }

    await savedSharedGroup.save();

    // Populate the response
    const populatedGroup = await SharedGroup.findById(savedSharedGroup._id)
      .populate('tasks')
      .populate('owner', 'name')
      .populate('members.user', 'name');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Error creating shared group from existing:', error);
    res.status(500).json({ error: error.message });
  }
});

