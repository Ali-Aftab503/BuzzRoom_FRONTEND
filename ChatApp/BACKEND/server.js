const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/.*\.vercel\.app$/,
      'https://buzz-room-frontend.vercel.app'
    ];
    
    const isAllowed = allowedPatterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Socket.io CORS
const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,
        /^https:\/\/.*\.vercel\.app$/
      ];
      
      const isAllowed = allowedPatterns.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(origin);
        }
        return pattern === origin;
      });
      
      callback(null, isAllowed);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const favoritesRoutes = require('./routes/favorites');
const directMessagesRoutes = require('./routes/directMessages');
const settingsRoutes = require('./routes/settings');
const { health } = require('./jobs/health');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/direct-messages', directMessagesRoutes);
app.use('/api/settings', settingsRoutes);

// Socket.io Logic
const users = {};
const rooms = {};
const userRooms = {};
const activeCalls = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('user-connected', (userId) => {
    users[userId] = socket.id;
    console.log(`✅ User registered: ${userId} -> Socket: ${socket.id}`);
    
    if (!userRooms[userId]) {
      userRooms[userId] = new Set();
    }
  });

  socket.on('join-room', ({ roomId, userId, username }) => {
    socket.join(roomId);
    
    if (!users[userId]) {
      users[userId] = socket.id;
    }
    
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

  socket.on('message-edited', ({ roomId, message }) => {
    io.to(roomId).emit('message-updated', message);
  });

  socket.on('message-deleted', ({ roomId, messageId }) => {
    io.to(roomId).emit('message-removed', { messageId });
  });

  socket.on('add-reaction', ({ roomId, messageId, reaction }) => {
    io.to(roomId).emit('reaction-added', { messageId, reaction });
  });

  socket.on('join-dm', ({ conversationId, userId }) => {
    socket.join(`dm-${conversationId}`);
  });

  socket.on('leave-dm', ({ conversationId, userId }) => {
    socket.leave(`dm-${conversationId}`);
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

  socket.on('dm-message-edited', ({ conversationId, message }) => {
    io.to(`dm-${conversationId}`).emit('dm-message-updated', message);
  });

  socket.on('dm-message-deleted', ({ conversationId, messageId }) => {
    io.to(`dm-${conversationId}`).emit('dm-message-removed', { messageId });
  });

  socket.on('dm-add-reaction', ({ conversationId, messageId, reaction }) => {
    io.to(`dm-${conversationId}`).emit('dm-reaction-added', { messageId, reaction });
  });

  // Video Call Events - Simplified
  socket.on('call-user', ({ callerId, receiverId, callerName, roomId, type }) => {
    console.log(`📞 Call from ${callerName} to room ${roomId}`);
    
    const callId = `call-${Date.now()}-${Math.random()}`;
    activeCalls.set(callId, { callerId, receiverId, roomId, type });
    
    socket.to(roomId).emit('incoming-call', {
      callId,
      callerId,
      callerName,
      type
    });
    
    console.log(`✅ Call broadcasted to room: ${roomId}`);
  });

  socket.on('accept-call', ({ callId, roomId }) => {
    console.log(`✅ Call accepted: ${callId}`);
    socket.to(roomId).emit('call-accepted', { callId });
  });

  socket.on('reject-call', ({ callId, roomId }) => {
    console.log(`❌ Call rejected: ${callId}`);
    socket.to(roomId).emit('call-rejected', { callId });
    activeCalls.delete(callId);
  });

  socket.on('end-call', ({ callId, roomId }) => {
    console.log(`📴 Call ended: ${callId}`);
    io.to(roomId).emit('call-ended', { callId });
    activeCalls.delete(callId);
  });

  // WebRTC Signaling
  socket.on('webrtc-signal', ({ roomId, signal }) => {
    console.log(`📡 WebRTC signal in room ${roomId}:`, signal.type);
    socket.to(roomId).emit('webrtc-signal', { signal });
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
          }
        });
      }
      
      delete users[userId];
      delete userRooms[userId];
    }
  });
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html>
    <head>
      <title>Server Status</title>
      <style>
        body {
          margin: 0;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #111;
          font-family: Arial, sans-serif;
          color: #fff;
        }

        h1 {
          font-size: 2.5rem;
          animation: heartbeat 1.5s infinite;
        }

        @keyframes heartbeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.1); }
          40% { transform: scale(0.95); }
          60% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      </style>
    </head>
    <body>
      <h1>Chat App Server is up and running successfully ✌🏼✌🏼✌🏼</h1>
    </body>
  </html>`);
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.get('/debug/state', (req, res) => {
  res.json({ 
    users: users,
    rooms: Object.keys(rooms),
    activeCalls: activeCalls.size,
    totalUsers: Object.keys(users).length
  });
});

const PORT = process.env.PORT || 5000;

health()

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ CORS enabled for all Vercel deployments`);
});