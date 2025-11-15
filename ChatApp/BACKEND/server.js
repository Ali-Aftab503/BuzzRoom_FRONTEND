const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://buzz-room-frontend.vercel.app", // Add your exact Vercel URL
    "https://*.vercel.app"
  ],
  credentials: true
}));
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL, // This will be your Vercel URL
      "https://*.vercel.app" // Allow all Vercel deployments
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Import Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const favoritesRoutes = require('./routes/favorites');
const directMessagesRoutes = require('./routes/directMessages');
const settingsRoutes = require('./routes/settings');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/direct-messages', directMessagesRoutes);
app.use('/api/settings', settingsRoutes);

// Socket.io Logic
const users = {}; // { userId: socketId }
const rooms = {}; // { roomId: { userId: { socketId, username, online } } }
const userRooms = {}; // { userId: Set([roomId1, roomId2]) }
const videoCalls = {}; // { callId: { caller, receiver, roomId, type } }

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('user-connected', (userId) => {
    users[userId] = socket.id;
    console.log(`✅ User ${userId} connected with socket ${socket.id}`);
    
    if (!userRooms[userId]) {
      userRooms[userId] = new Set();
    }
  });

  socket.on('join-room', ({ roomId, userId, username }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {};
    }
    
    rooms[roomId][userId] = {
      socketId: socket.id,
      username: username,
      online: true
    };
    
    if (!userRooms[userId]) {
      userRooms[userId] = new Set();
    }
    userRooms[userId].add(roomId);

    const onlineUsers = Object.keys(rooms[roomId]).filter(
      id => rooms[roomId][id].online
    );

    socket.to(roomId).emit('user-joined', {
      userId,
      username,
      message: `${username} joined the room`
    });

    io.to(roomId).emit('room-users-updated', {
      roomId,
      onlineCount: onlineUsers.length,
      onlineUsers: onlineUsers
    });
    
    io.emit('global-room-update', {
      roomId,
      onlineCount: onlineUsers.length
    });
    
    console.log(`👥 User ${username} joined room ${roomId}. Online: ${onlineUsers.length}`);
  });

  socket.on('leave-room', ({ roomId, userId, username }) => {
    socket.leave(roomId);
    
    if (rooms[roomId] && rooms[roomId][userId]) {
      rooms[roomId][userId].online = false;
    }
    
    if (userRooms[userId]) {
      userRooms[userId].delete(roomId);
    }

    const onlineUsers = rooms[roomId] 
      ? Object.keys(rooms[roomId]).filter(id => rooms[roomId][id].online)
      : [];

    socket.to(roomId).emit('user-left', {
      userId,
      username,
      message: `${username} left the room`
    });

    io.to(roomId).emit('room-users-updated', {
      roomId,
      onlineCount: onlineUsers.length,
      onlineUsers: onlineUsers
    });
    
    io.emit('global-room-update', {
      roomId,
      onlineCount: onlineUsers.length
    });
    
    console.log(`👋 User ${username} left room ${roomId}. Online: ${onlineUsers.length}`);
  });

  socket.on('send-message', (messageData) => {
    io.to(messageData.roomId).emit('receive-message', messageData);
  });

  socket.on('typing', ({ roomId, username }) => {
    socket.to(roomId).emit('user-typing', { username });
  });

  socket.on('stop-typing', ({ roomId }) => {
    socket.to(roomId).emit('user-stop-typing');
  });

  // Message edit/delete events
  socket.on('message-edited', ({ roomId, message }) => {
    io.to(roomId).emit('message-updated', message);
  });

  socket.on('message-deleted', ({ roomId, messageId }) => {
    io.to(roomId).emit('message-removed', { messageId });
  });

  // Reaction events
  socket.on('add-reaction', ({ roomId, messageId, reaction }) => {
    io.to(roomId).emit('reaction-added', { messageId, reaction });
  });

  // Direct Message events
  socket.on('join-dm', ({ conversationId, userId }) => {
    socket.join(`dm-${conversationId}`);
    console.log(`💬 User ${userId} joined DM conversation ${conversationId}`);
  });

  socket.on('leave-dm', ({ conversationId, userId }) => {
    socket.leave(`dm-${conversationId}`);
    console.log(`💬 User ${userId} left DM conversation ${conversationId}`);
  });

  socket.on('send-dm', (messageData) => {
    io.to(`dm-${messageData.conversationId}`).emit('receive-dm', messageData);
  });

  socket.on('dm-typing', ({ conversationId, username }) => {
    socket.to(`dm-${conversationId}`).emit('dm-user-typing', { username });
  });

  socket.on('dm-stop-typing', ({ conversationId }) => {
    socket.to(`dm-${conversationId}`).emit('dm-user-stop-typing');
  });

  // DM message edit/delete events
  socket.on('dm-message-edited', ({ conversationId, message }) => {
    io.to(`dm-${conversationId}`).emit('dm-message-updated', message);
  });

  socket.on('dm-message-deleted', ({ conversationId, messageId }) => {
    io.to(`dm-${conversationId}`).emit('dm-message-removed', { messageId });
  });

  // DM reaction events
  socket.on('dm-add-reaction', ({ conversationId, messageId, reaction }) => {
    io.to(`dm-${conversationId}`).emit('dm-reaction-added', { messageId, reaction });
  });

  // Video/Voice Call Events
  socket.on('call-user', ({ callerId, receiverId, callerName, roomId, type }) => {
    const callId = `${callerId}-${receiverId}-${Date.now()}`;
    videoCalls[callId] = { caller: callerId, receiver: receiverId, roomId, type };
    
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incoming-call', {
        callId,
        callerId,
        callerName,
        roomId,
        type
      });
    }
  });

  socket.on('answer-call', ({ callId, answer }) => {
    const call = videoCalls[callId];
    if (call) {
      const callerSocketId = users[call.caller];
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-answered', { callId, answer });
      }
    }
  });

  socket.on('reject-call', ({ callId }) => {
    const call = videoCalls[callId];
    if (call) {
      const callerSocketId = users[call.caller];
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-rejected', { callId });
      }
      delete videoCalls[callId];
    }
  });

  socket.on('end-call', ({ callId }) => {
    const call = videoCalls[callId];
    if (call) {
      const callerSocketId = users[call.caller];
      const receiverSocketId = users[call.receiver];
      
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-ended', { callId });
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call-ended', { callId });
      }
      
      delete videoCalls[callId];
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', ({ callId, offer }) => {
    const call = videoCalls[callId];
    if (call) {
      const receiverSocketId = users[call.receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('webrtc-offer', { callId, offer });
      }
    }
  });

  socket.on('webrtc-answer', ({ callId, answer }) => {
    const call = videoCalls[callId];
    if (call) {
      const callerSocketId = users[call.caller];
      if (callerSocketId) {
        io.to(callerSocketId).emit('webrtc-answer', { callId, answer });
      }
    }
  });

  socket.on('webrtc-ice-candidate', ({ callId, candidate, isReceiver }) => {
    const call = videoCalls[callId];
    if (call) {
      const targetSocketId = isReceiver ? users[call.caller] : users[call.receiver];
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-ice-candidate', { callId, candidate });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    
    const userId = Object.keys(users).find(key => users[key] === socket.id);
    
    if (userId) {
      if (userRooms[userId]) {
        userRooms[userId].forEach(roomId => {
          if (rooms[roomId] && rooms[roomId][userId]) {
            rooms[roomId][userId].online = false;
            
            const onlineUsers = Object.keys(rooms[roomId]).filter(
              id => rooms[roomId][id].online
            );
            
            io.to(roomId).emit('room-users-updated', {
              roomId,
              onlineCount: onlineUsers.length,
              onlineUsers: onlineUsers
            });
            
            io.emit('global-room-update', {
              roomId,
              onlineCount: onlineUsers.length
            });
            
            console.log(`❌ User ${userId} went offline in room ${roomId}. Online: ${onlineUsers.length}`);
          }
        });
      }
      
      delete users[userId];
      delete userRooms[userId];
    }
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Chat App API is running!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});