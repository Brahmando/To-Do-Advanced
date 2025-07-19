
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

// Find group by name (for private group joining)
router.get('/find-by-name/:name', auth, async (req, res) => {
  try {
    const groupName = decodeURIComponent(req.params.name);
    
    const group = await SharedGroup.findOne({ name: groupName })
      .select('_id name isPublic accessKey owner');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
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
          if (request.user.toString() === userId && !request.dismissed) {
            if (request.status === 'pending') {
              // Informational notification for pending requests
              notifications.push({
                type: 'request_sent',
                groupId: group._id,
                groupName: group.name,
                requestId: request._id,
                requestedRole: request.requestedRole,
                message: `You have sent a request to change observer to ${request.requestedRole} status in this group`,
                createdAt: request.createdAt,
                dismissible: true
              });
            } else if (request.status !== 'pending') {
              // Status update notifications (approved/rejected)
              notifications.push({
                type: 'request_update',
                groupId: group._id,
                groupName: group.name,
                requestId: request._id,
                status: request.status,
                requestedRole: request.requestedRole,
                message: request.status === 'approved' 
                  ? `Your request to upgrade to ${request.requestedRole} has been approved`
                  : `Your request to upgrade to ${request.requestedRole} has been rejected`,
                createdAt: request.updatedAt || request.createdAt,
                dismissible: true
              });
            }
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
    const isOwner = group.owner.toString() === userId;
    const isMember = group.members.some(member => member.user.toString() === userId);
    const hasAccess = isOwner || isMember || group.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Convert to plain object to modify the response
    const groupData = group.toObject();
    
    // Debug logging
    console.log('Group data before modification:', JSON.stringify({
      accessKey: groupData.accessKey,
      isOwner,
      userId,
      groupOwner: group.owner.toString()
    }, null, 2));
    
    // Only include access key if the user is the owner
    if (!isOwner) {
      delete groupData.accessKey;
    } else {
      console.log('Including access key for owner:', groupData.accessKey);
    }

    console.log('Sending group data to client:', JSON.stringify({
      accessKey: groupData.accessKey ? '***HIDDEN***' : undefined,
      isPrivate: groupData.isPrivate,
      name: groupData.name
    }, null, 2));

    res.json(groupData);
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

// Delete shared group
router.delete('/:id/delete', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.id;
    
    const user = await User.findById(userId);
    const group = await SharedGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const member = group.members.find(m => m.user.toString() === userId);
    if (!member || !['owner', 'collaborator'].includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await group.deleteOne({ _id: groupId });
    res.json({ message: 'Group deleted successfully' });
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
    console.log(groupId)
    
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
      return res.status(403).json({ error: 'Failed to join group. Please check your credentials.' });
    }

    // For observer role (both public and private groups), join immediately
    if (role === 'observer') {
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

    // For collaborator or medium access, create join request (both public and private)
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
      // Find existing member and update their role instead of adding duplicate
      const existingMemberIndex = group.members.findIndex(
        member => member.user.toString() === joinRequest.user.toString()
      );
      
      if (existingMemberIndex !== -1) {
        // Update existing member's role
        group.members[existingMemberIndex].role = joinRequest.requestedRole;
      } else {
        // Add new member if they don't exist (shouldn't happen for role upgrades)
        group.members.push({
          user: joinRequest.user,
          userName: joinRequest.userName,
          role: joinRequest.requestedRole
        });
      }
      
      // Add to change log
      group.changeLog.push({
        user: userId,
        userName: group.ownerName,
        action: 'approved_role_upgrade',
        commitMessage: `Approved ${joinRequest.userName} role upgrade to ${joinRequest.requestedRole}`
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
  console.log('coming here')

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

    // Log the incoming task order
    console.log('Reordering tasks. New order:', taskIds);
    
    // Create a map of task IDs to their new order
    const taskOrderMap = new Map();
    taskIds.forEach((taskId, index) => {
      taskOrderMap.set(taskId, index);
    });

    // Update task orders and maintain the original task objects
    const updatedTasks = group.tasks.map(task => {
      const newOrder = taskOrderMap.get(task._id.toString());
      if (newOrder !== undefined) {
        return {
          ...task.toObject(),
          order: newOrder
        };
      }
      return task;
    });

    // Sort tasks by the new order
    updatedTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Log the updated task orders
    console.log('Updated task orders:', updatedTasks.map(t => ({
      _id: t._id,
      text: t.text,
      order: t.order
    })));

    // Update the group's tasks
    group.tasks = updatedTasks;
    
    // Add to change log
    group.changeLog.push({
      user: userId,
      userName: user.name,
      action: 'reordered_tasks',
      commitMessage: commitMessage || 'Reordered tasks',
      timestamp: new Date()
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    
    // Mark tasks as modified to ensure they get saved
    group.markModified('tasks');
    
    // Save and return the updated group
    const savedGroup = await group.save();
    
    // Ensure we return the tasks in the correct order
    const responseGroup = await SharedGroup.findById(groupId);
    responseGroup.tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    res.json(responseGroup);
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

// Role upgrade request routes
router.post('/:id/role-upgrade-request', auth, async (req, res) => {
  try {
    const { requestedRole, message } = req.body;
    const userId = req.user.userId;
    const groupId = req.params.id;
    
    const user = await User.findById(userId);
    const group = await SharedGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is a member of the group
    const member = group.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Check if user is owner (owners cannot request upgrades)
    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Owners cannot request role changes' });
    }
    
    // Check if user is requesting the same role they already have
    if (member.role === requestedRole) {
      return res.status(400).json({ error: 'You already have this role' });
    }
    
    // Check if user has a pending request
    const existingRequest = group.joinRequests.find(
      request => request.user.toString() === userId && request.status === 'pending'
    );
    
    if (existingRequest) {
      // Check if 7 days have passed since the last request
      const daysSinceRequest = (new Date() - existingRequest.createdAt) / (1000 * 60 * 60 * 24);
      if (daysSinceRequest < 7) {
        const daysLeft = Math.ceil(7 - daysSinceRequest);
        return res.status(400).json({ 
          error: `You have a pending request. Please wait ${daysLeft} more day(s) before requesting again.`,
          pendingRequest: true,
          daysLeft
        });
      }
    }
    
    // Create new role upgrade request
    group.joinRequests.push({
      user: userId,
      userName: user.name,
      requestedRole,
      message: message || `Request to upgrade role from ${member.role} to ${requestedRole}`,
      status: 'pending',
      createdAt: new Date()
    });
    
    group.lastActivity = new Date();
    await group.save();
    
    res.json({ 
      message: `Role upgrade request sent to group owner`,
      notification: `You have sent a request to change ${member.role} to ${requestedRole} status`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's role upgrade status for a specific group
router.get('/:id/role-upgrade-status', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.id;
    
    const group = await SharedGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is a member
    const member = group.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Find user's pending request
    const pendingRequest = group.joinRequests.find(
      request => request.user.toString() === userId && request.status === 'pending'
    );
    
    if (pendingRequest) {
      const daysSinceRequest = (new Date() - pendingRequest.createdAt) / (1000 * 60 * 60 * 24);
      const daysLeft = Math.max(0, Math.ceil(7 - daysSinceRequest));
      
      return res.json({
        hasPendingRequest: true,
        requestedRole: pendingRequest.requestedRole,
        daysLeft,
        canRequestAgain: daysLeft === 0
      });
    }
    
    res.json({
      hasPendingRequest: false,
      canRequestAgain: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dismiss notification (mark as read/dismissed)
router.put('/notifications/:groupId/dismiss/:requestId', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId, requestId } = req.params;
    
    const group = await SharedGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Find the request and mark it as dismissed for this user
    const request = group.joinRequests.find(
      req => req._id.toString() === requestId && req.user.toString() === userId
    );
    
    if (request) {
      request.dismissed = true;
      request.dismissedAt = new Date();
      await group.save();
    }
    
    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exit group
router.post('/:id/exit', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.id;
    
    const group = await SharedGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const member = group.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({ error: 'You are not a member of this group' });
    }
    
    // Check if user is owner
    if (member.role === 'owner') {
      // Owner can only exit if there are other members to transfer ownership to
      const otherMembers = group.members.filter(m => m.user.toString() !== userId);
      if (otherMembers.length === 0) {
        return res.status(400).json({ error: 'Cannot exit group as the only member. Delete the group instead.' });
      }
      return res.status(400).json({ error: 'Owners must transfer ownership before exiting the group' });
    }
    
    // Remove member from group
    group.members = group.members.filter(m => m.user.toString() !== userId);
    
    // Add to change log
    group.changeLog.push({
      user: userId,
      userName: member.userName,
      action: 'left_group',
      commitMessage: `${member.userName} left the group`,
      timestamp: new Date()
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    await group.save();
    
    res.json({ message: 'Successfully exited the group' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer ownership
router.put('/:id/transfer-ownership', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.id;
    const { newOwnerId } = req.body;
    
    const group = await SharedGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if current user is owner
    const currentOwner = group.members.find(m => m.user.toString() === userId && m.role === 'owner');
    if (!currentOwner) {
      return res.status(403).json({ error: 'Only the owner can transfer ownership' });
    }
    
    // Check if new owner is a member
    const newOwner = group.members.find(m => m.user.toString() === newOwnerId);
    if (!newOwner) {
      return res.status(404).json({ error: 'New owner must be a member of the group' });
    }
    
    // Update roles
    currentOwner.role = 'collaborator';
    newOwner.role = 'owner';
    
    // Update group owner
    group.owner = newOwnerId;
    group.ownerName = newOwner.userName;
    
    // Add to change log
    group.changeLog.push({
      user: userId,
      userName: currentOwner.userName,
      action: 'transferred_ownership',
      commitMessage: `Transferred ownership to ${newOwner.userName}`,
      timestamp: new Date()
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    await group.save();
    
    res.json({ message: 'Ownership transferred successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member role
router.put('/:id/members/:memberId/role', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: groupId, memberId } = req.params;
    const { role } = req.body;
    
    const group = await SharedGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if current user is owner
    const currentUser = group.members.find(m => m.user.toString() === userId);
    if (!currentUser || currentUser.role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can change member roles' });
    }
    
    // Find the member to update
    const member = group.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Cannot change owner role
    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }
    
    const oldRole = member.role;
    member.role = role;
    
    // Add to change log
    group.changeLog.push({
      user: userId,
      userName: currentUser.userName,
      action: 'changed_member_role',
      commitMessage: `Changed ${member.userName} role from ${oldRole} to ${role}`,
      timestamp: new Date()
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    await group.save();
    
    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: groupId, memberId } = req.params;
    
    const group = await SharedGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if current user is owner
    const currentUser = group.members.find(m => m.user.toString() === userId);
    if (!currentUser || currentUser.role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can remove members' });
    }
    
    // Find the member to remove
    const member = group.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Cannot remove owner
    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove the owner' });
    }
    
    // Remove member
    group.members = group.members.filter(m => m.user.toString() !== memberId);
    
    // Add to change log
    group.changeLog.push({
      user: userId,
      userName: currentUser.userName,
      action: 'removed_member',
      commitMessage: `Removed ${member.userName} from the group`,
      timestamp: new Date()
    });
    
    group.totalChanges += 1;
    group.lastActivity = new Date();
    await group.save();
    
    res.json({ message: 'Member removed successfully' });
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

