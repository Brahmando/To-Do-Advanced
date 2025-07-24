const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/Chat');
const auth = require('../middleware/auth');

// Get messages for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await ChatMessage.find({ groupId })
      .populate('sender', 'name')
      .populate('replyTo', 'message sender')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Reverse to get chronological order (oldest first)
    const chronologicalMessages = messages.reverse();

    res.json({
      success: true,
      messages: chronologicalMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await ChatMessage.countDocuments({ groupId })
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages' 
    });
  }
});

// Send a message (this will be handled by Socket.IO, but keeping for backup)
router.post('/group/:groupId/message', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message, replyTo } = req.body;
    const userId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message content is required' 
      });
    }

    const newMessage = new ChatMessage({
      groupId,
      sender: userId,
      senderName: req.user.name,
      message: message.trim(),
      replyTo: replyTo || null
    });

    await newMessage.save();
    await newMessage.populate('sender', 'name');

    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message' 
    });
  }
});

// Edit a message
router.put('/message/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message content is required' 
      });
    }

    const chatMessage = await ChatMessage.findById(messageId);
    
    if (!chatMessage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }

    // Only allow sender to edit their own message
    if (chatMessage.sender.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own messages' 
      });
    }

    // Don't allow editing messages older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (chatMessage.createdAt < fifteenMinutesAgo) {
      return res.status(403).json({ 
        success: false, 
        message: 'Messages can only be edited within 15 minutes of posting' 
      });
    }

    chatMessage.message = message.trim();
    chatMessage.edited = true;
    chatMessage.editedAt = new Date();

    await chatMessage.save();
    await chatMessage.populate('sender', 'name');

    res.json({
      success: true,
      message: chatMessage
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to edit message' 
    });
  }
});

// Delete a message
router.delete('/message/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const chatMessage = await ChatMessage.findById(messageId);
    
    if (!chatMessage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }

    // Only allow sender to delete their own message
    if (chatMessage.sender.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own messages' 
      });
    }

    await ChatMessage.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete message' 
    });
  }
});

module.exports = router;