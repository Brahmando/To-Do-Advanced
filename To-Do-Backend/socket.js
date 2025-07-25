const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const ChatMessage = require('./models/Chat');

// Online users tracking
const onlineUsers = new Map(); // userId -> socketId
const groupUsers = new Map(); // groupId -> Set of userIds

function setupSocketServer(server) {
  // Configure CORS origins from environment variables
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ["http://localhost:3000", "http://localhost:5173","https://to-do-advanced-rose.vercel.app"]; // fallback for development

  const io = socketIo(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error('User not found'));
      
      socket.userId = decoded.userId;
      socket.userName = user.name;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userName})`);
    onlineUsers.set(socket.userId, socket.id);

    // Join a group chat room
    socket.on('join-group', (groupId) => {
      socket.join(`group:${groupId}`);
      
      // Track user in group
      if (!groupUsers.has(groupId)) {
        groupUsers.set(groupId, new Set());
      }
      groupUsers.get(groupId).add(socket.userId);
      
      console.log(`User ${socket.userName} joined group ${groupId}`);
      
      // Broadcast updated online users
      io.to(`group:${groupId}`).emit('online-users', {
        groupId,
        onlineCount: groupUsers.get(groupId).size,
        onlineUsers: Array.from(groupUsers.get(groupId))
      });
    });

    // Leave a group chat room
    socket.on('leave-group', (groupId) => {
      socket.leave(`group:${groupId}`);
      
      // Remove user from group tracking
      if (groupUsers.has(groupId)) {
        groupUsers.get(groupId).delete(socket.userId);
        
        console.log(`User ${socket.userName} left group ${groupId}`);
        
        // Broadcast updated online users
        io.to(`group:${groupId}`).emit('online-users', {
          groupId,
          onlineCount: groupUsers.get(groupId).size,
          onlineUsers: Array.from(groupUsers.get(groupId))
        });
      }
    });

    // New message
    socket.on('send-message', async (data) => {
      try {
        const { groupId, message, replyTo } = data;
        
        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        // Save message to database
        const newMessage = new ChatMessage({
          groupId,
          sender: socket.userId,
          senderName: socket.userName,
          message: message.trim(),
          replyTo: replyTo || null
        });

        await newMessage.save();
        await newMessage.populate('sender', 'name');
        
        console.log(`Message sent in group ${groupId} by ${socket.userName}: ${message.substring(0, 50)}...`);

        // Broadcast to all users in the group
        io.to(`group:${groupId}`).emit('new-message', newMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (groupId) => {
      socket.to(`group:${groupId}`).emit('user-typing', {
        groupId,
        userId: socket.userId,
        userName: socket.userName
      });
    });

    // Stop typing indicator
    socket.on('stop-typing', (groupId) => {
      socket.to(`group:${groupId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId} (${socket.userName})`);
      onlineUsers.delete(socket.userId);
      
      // Remove user from all groups
      for (const [groupId, users] of groupUsers.entries()) {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          
          // Broadcast updated online users
          io.to(`group:${groupId}`).emit('online-users', {
            groupId,
            onlineCount: users.size,
            onlineUsers: Array.from(users)
          });
        }
      }
    });
  });

  return io;
}

module.exports = setupSocketServer;