import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageAPI, roomAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { ChatRoomSkeleton } from '../common/SkeletonLoader';
import Toast from '../common/Toast';

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [toast, setToast] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasJoinedRoom = useRef(false);

  const socket = getSocket();

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (!socket) {
      console.error('❌ Socket not initialized!');
      showToast('Connection failed. Please refresh the page.', 'error');
      return;
    }

    console.log('🔌 Setting up socket listeners for room:', roomId);

    // Monitor connection status
    const handleConnect = () => {
      console.log('✅ Socket connected');
      setConnectionStatus('connected');
      
      // Re-join room on reconnect
      if (hasJoinedRoom.current) {
        console.log('🔄 Reconnecting to room...');
        socket.emit('join-room', {
          roomId,
          userId: user.id,
          username: user.username,
        });
      }
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setConnectionStatus('disconnected');
      showToast('Connection lost. Reconnecting...', 'warning');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    fetchRoomData();

    // JOIN ROOM - This is critical!
    if (!hasJoinedRoom.current && socket.connected) {
      console.log('👋 Joining room...', { roomId, userId: user.id, username: user.username });
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        username: user.username,
      });
      hasJoinedRoom.current = true;
    }

    const handleReceiveMessage = (messageData) => {
      console.log('📨 Received message:', messageData);
      setMessages((prev) => {
        const exists = prev.some(msg => 
          msg._id === messageData._id || 
          (msg.content === messageData.content && 
           msg.sender._id === messageData.sender._id &&
           Math.abs(new Date(msg.createdAt) - new Date(messageData.createdAt)) < 1000)
        );
        if (exists) return prev;
        return [...prev, messageData];
      });
    };

    const handleUserJoined = (data) => {
      console.log('👤 User joined:', data);
      setMessages((prev) => [
        ...prev,
        {
          _id: 'system-' + Date.now() + Math.random(),
          content: data.message,
          messageType: 'system',
          createdAt: new Date(),
        },
      ]);
    };

    const handleUserLeft = (data) => {
      console.log('👋 User left:', data);
      setMessages((prev) => [
        ...prev,
        {
          _id: 'system-' + Date.now() + Math.random(),
          content: data.message,
          messageType: 'system',
          createdAt: new Date(),
        },
      ]);
    };

    const handleRoomUsersUpdate = (data) => {
      console.log('👥 Room users updated:', data);
      setOnlineUsers(data.onlineUsers || []);
      setOnlineCount(data.onlineCount || 0);
    };

    const handleUserTyping = (data) => {
      if (data.username !== user.username) {
        setTyping(`${data.username} is typing...`);
      }
    };

    const handleUserStopTyping = () => {
      setTyping('');
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('room-users-updated', handleRoomUsersUpdate);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('room-users-updated', handleRoomUsersUpdate);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);

      if (hasJoinedRoom.current) {
        console.log('👋 Leaving room...');
        socket.emit('leave-room', {
          roomId,
          userId: user.id,
          username: user.username,
        });
        hasJoinedRoom.current = false;
      }
    };
  }, [roomId, socket, user.id, user.username]);

  const fetchRoomData = async () => {
    try {
      const [roomResponse, messagesResponse] = await Promise.all([
        roomAPI.getRoom(roomId),
        messageAPI.getMessages(roomId),
      ]);
      
      setRoom(roomResponse.data.data.room);
      setMessages(messagesResponse.data.data.messages);
      console.log('✅ Room data loaded');
    } catch (error) {
      console.error('❌ Fetch room data error:', error);
      showToast('Failed to load room. Please try again.', 'error');
      
      setTimeout(() => {
        fetchRoomData();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageContent, messageType = 'text') => {
    if (!messageContent.trim()) return;

    if (connectionStatus !== 'connected') {
      showToast('Cannot send message. Connection lost.', 'error');
      return;
    }

    const tempMessageId = 'temp-' + Date.now() + Math.random();
    const tempMessage = {
      _id: tempMessageId,
      roomId,
      content: messageContent,
      sender: {
        _id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
      messageType: messageType,
      createdAt: new Date(),
      status: 'sending',
    };

    console.log('📤 Sending message:', tempMessage);
    setMessages((prev) => [...prev, tempMessage]);

    try {
      if (socket && socket.connected) {
        socket.emit('send-message', tempMessage);
        
        setMessages((prev) => 
          prev.map(msg => 
            msg._id === tempMessageId 
              ? { ...msg, status: 'sent' }
              : msg
          )
        );
      } else {
        throw new Error('Socket not connected');
      }

      const response = await messageAPI.sendMessage({
        roomId,
        content: messageContent,
        messageType: messageType,
      });

      setMessages((prev) => 
        prev.map(msg => 
          msg._id === tempMessageId 
            ? { ...msg, _id: response.data.data.message._id, status: 'delivered' }
            : msg
        )
      );

      console.log('✅ Message saved to database');
    } catch (error) {
      console.error('❌ Send message error:', error);
      
      setMessages((prev) => 
        prev.map(msg => 
          msg._id === tempMessageId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );

      showToast('Message failed to send.', 'error');
    }
  };

  const handleTyping = () => {
    if (socket && socket.connected) {
      socket.emit('typing', { roomId, username: user.username });
    }
  };

  const handleStopTyping = () => {
    if (socket && socket.connected) {
      socket.emit('stop-typing', { roomId });
    }
  };

  if (loading) {
    return <ChatRoomSkeleton />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {connectionStatus !== 'connected' && (
        <div className={`px-4 py-2 text-center text-sm font-semibold ${
          connectionStatus === 'reconnecting' 
            ? 'bg-yellow-500/20 text-yellow-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {connectionStatus === 'reconnecting' 
            ? 'Reconnecting...'
            : 'Connection lost. Please refresh the page.'}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#18181b] border-b border-zinc-800 shadow-lg">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/rooms')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-3 rounded-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{room?.name}</h2>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      onlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-xs text-zinc-400">{onlineCount} online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-3 rounded-xl transition-all duration-200 hidden sm:block"
                title="View members"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>

              <div className="flex items-center space-x-2 bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-700">
                <img src={user?.avatar} alt={user?.username} className="w-8 h-8 rounded-full ring-2 ring-indigo-500" />
                <span className="font-semibold text-white hidden sm:inline">{user?.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MessageList messages={messages} currentUserId={user.id} typing={typing} />

      <div className="bg-[#18181b] border-t border-zinc-800">
        <div className="px-4 sm:px-6 py-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            disabled={connectionStatus !== 'connected'}
          />
        </div>
      </div>

      {showMembers && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn" onClick={() => setShowMembers(false)}>
          <div className="bg-[#18181b] border-l border-zinc-800 w-80 h-full animate-slideInRight" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Members</h3>
                  <p className="text-zinc-400 text-sm">{onlineCount} online</p>
                </div>
                <button onClick={() => setShowMembers(false)} className="text-zinc-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto">
              {room?.participants.map((member) => (
                <div key={member._id} className="bg-zinc-800 rounded-xl p-4 flex items-center space-x-3 border border-zinc-700 hover:border-zinc-600 transition">
                  <img src={member.avatar} alt={member.username} className="w-12 h-12 rounded-full ring-2 ring-indigo-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{member.username}</p>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        onlineUsers.includes(member._id) ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <p className="text-xs text-zinc-400">
                        {onlineUsers.includes(member._id) ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;