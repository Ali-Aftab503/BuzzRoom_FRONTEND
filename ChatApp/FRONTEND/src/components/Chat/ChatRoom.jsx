import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageAPI, roomAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoCall from '../VideoCall/VideoCall';
import { ChatRoomSkeleton } from '../common/SkeletonLoader';
import Toast from '../common/Toast';
import {
  ArrowLeft,
  Hash,
  Video,
  Phone,
  Users,
  X,
  PhoneIncoming,
  PhoneOff
} from 'lucide-react';

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
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [calling, setCalling] = useState(false); // Track outgoing call state

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

      // Register user first
      socket.emit('user-connected', user.id);

      socket.emit('join-room', { roomId, userId: user.id, username: user.username });

      // IMPORTANT: Register user first
      socket.emit('user-connected', user.id);
      console.log('📡 Emitted user-connected:', user.id);

      // Then join room
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

    const handleMessageUpdated = (updatedMessage) => {
      setMessages(prev => prev.map(msg =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
    };

    const handleMessageRemoved = ({ messageId }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, deleted: true, content: 'This message was deleted' } : msg
      ));
    };

    const handleReactionAdded = ({ messageId, reaction }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const reactions = msg.reactions || [];
          const existingIndex = reactions.findIndex(
            r => r.user._id === reaction.user._id && r.emoji === reaction.emoji
          );
          if (existingIndex >= 0) {
            reactions.splice(existingIndex, 1);
          } else {
            reactions.push(reaction);
          }
          return { ...msg, reactions: [...reactions] };
        }
        return msg;
      }));
    };

    // Video call events
    const handleIncomingCall = ({ callId, callerId, callerName, type }) => {
      setIncomingCall({ callId, callerId, callerName, type });
    };

    const handleCallAccepted = ({ callId, acceptorId }) => {
      console.log('✅ Call accepted by:', acceptorId);
      setCalling(false); // Stop showing "Calling..."

      // Find the other user details
      const otherUser = room.participants.find(p => p._id === acceptorId);

      setActiveCall({
        callId,
        isInitiator: true, // We are the initiator
        otherUser: otherUser || { username: 'User' },
        type: 'video' // Default or passed from state if we tracked it
      });
    };

    const handleCallRejected = () => {
      showToast('Call was rejected', 'info');
      setCalling(false);
      setActiveCall(null);
    };

    const handleCallEnded = () => {
      showToast('Call ended', 'info');
      setCalling(false);
      setActiveCall(null);
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('room-users-updated', handleRoomUsersUpdate);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);
    socket.on('message-updated', handleMessageUpdated);
    socket.on('message-removed', handleMessageRemoved);
    socket.on('reaction-added', handleReactionAdded);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted); // Add this listener
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

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
      socket.off('message-updated', handleMessageUpdated);
      socket.off('message-removed', handleMessageRemoved);
      socket.off('reaction-added', handleReactionAdded);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);

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
      reactions: []
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
            ? { ...response.data.data.message, status: 'delivered' }
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

  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await messageAPI.addReaction(messageId, emoji);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? response.data.data.message : msg
      ));
      socket.emit('add-reaction', { roomId, messageId, reaction: { user: { _id: user.id, username: user.username, avatar: user.avatar }, emoji } });
    } catch (error) {
      console.error('Add reaction error:', error);
      showToast('Failed to add reaction', 'error');
    }
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      const response = await messageAPI.editMessage(messageId, content);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? response.data.data.message : msg
      ));
      socket.emit('message-edited', { roomId, message: response.data.data.message });
    } catch (error) {
      console.error('Edit message error:', error);
      showToast('Failed to edit message', 'error');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messageAPI.deleteMessage(messageId);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, deleted: true, content: 'This message was deleted' } : msg
      ));
      socket.emit('message-deleted', { roomId, messageId });
    } catch (error) {
      console.error('Delete message error:', error);
      showToast('Failed to delete message', 'error');
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

  const startCall = (type) => {
    if (onlineCount <= 1) {
      showToast('No one else is in the room', 'info');
      return;
    }

    // Get the first online user that's not the current user
    const otherUserId = onlineUsers.find(userId => userId !== user.id);

    if (!otherUserId) {
      showToast('No other user found', 'error');
      return;
    }

    // Find the user details
    const otherUser = room.participants.find(p => p._id === otherUserId);

    if (!otherUser) {
      showToast('Could not find user details', 'error');
      return;
    }

    console.log('📞 Starting call to:', otherUser.username, 'userId:', otherUserId);

    const callId = `${user.id}-${otherUserId}-${Date.now()}`;

    if (!socket || !socket.connected) {
      showToast('Socket not connected', 'error');
      return;
    }

    socket.emit('call-user', {
      callerId: user.id,
      receiverId: otherUserId,
      callerName: user.username,
      roomId,
      type
    });

    console.log('📤 Call signal sent');

    // Don't set activeCall yet! Set calling state instead.
    setCalling(true);
    // setActiveCall({ callId, isInitiator: true, otherUser, type }); 
  };

  const acceptCall = () => {
    if (incomingCall) {
      const caller = room.participants.find(p => p._id === incomingCall.callerId);
      setActiveCall({
        callId: incomingCall.callId,
        isInitiator: false,
        otherUser: caller || { username: incomingCall.callerName },
        type: incomingCall.type
      });
      socket.emit('accept-call', { callId: incomingCall.callId, roomId });
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('reject-call', { callId: incomingCall.callId });
      setIncomingCall(null);
    }
  };

  const cancelCall = () => {
    setCalling(false);
    // You might want to emit a 'cancel-call' event here if you want to stop the ringing on the other end
  };

  const endCall = () => {
    setActiveCall(null);
  };

  if (loading) {
    return <ChatRoomSkeleton />;
  }

  if (activeCall) {
    return (
      <VideoCall
        callId={activeCall.callId}
        isInitiator={activeCall.isInitiator}
        otherUserName={activeCall.otherUser.username}
        socket={socket}
        onEndCall={endCall}
        callType={activeCall.type}
        roomId={roomId}
      />
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0f0f0f]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed top-4 right-4 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl z-50 animate-slideInRight">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center animate-pulse">
              <PhoneIncoming className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold">
                {incomingCall.callerName}
              </p>
              <p className="text-zinc-400 text-xs">
                Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call...
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={acceptCall}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={rejectCall}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      )}

      {/* Outgoing Call Overlay */}
      {calling && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-indigo-500 rounded-full animate-ping opacity-20"></div>
              <Phone className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Calling...</h3>
            <p className="text-zinc-400 mb-8">Waiting for response</p>
            <button
              onClick={cancelCall}
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full font-semibold transition flex items-center mx-auto space-x-2"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {connectionStatus !== 'connected' && (
        <div className={`px-4 py-2 text-center text-sm font-semibold ${connectionStatus === 'reconnecting'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-red-500/20 text-red-400'
          }`}>
          {connectionStatus === 'reconnecting'
            ? 'Reconnecting...'
            : 'Connection lost. Please refresh the page.'}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#18181b] border-b border-zinc-800 shadow-lg shrink-0">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/rooms')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-2.5 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[120px] sm:max-w-xs">{room?.name}</h2>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                      }`}></div>
                    <span className="text-xs text-zinc-400">{onlineCount} online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Video Call Button */}
              <button
                onClick={() => startCall('video')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-2.5 rounded-xl transition-all duration-200"
                title="Start video call"
              >
                <Video className="w-5 h-5" />
              </button>

              {/* Voice Call Button */}
              <button
                onClick={() => startCall('audio')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-2.5 rounded-xl transition-all duration-200"
                title="Start voice call"
              >
                <Phone className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowMembers(!showMembers)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-2.5 rounded-xl transition-all duration-200 hidden sm:block"
                title="View members"
              >
                <Users className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center space-x-2 bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-700 ml-2">
                <img src={user?.avatar} alt={user?.username} className="w-7 h-7 rounded-full ring-2 ring-indigo-500" />
                <span className="font-semibold text-white text-sm">{user?.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MessageList
        messages={messages}
        currentUserId={user.id}
        typing={typing}
        onReaction={handleReaction}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
      />

      <div className="bg-[#18181b] border-t border-zinc-800 shrink-0 pb-safe">
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
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-88px)]">
              {room?.participants.map((member) => (
                <div key={member._id} className="bg-zinc-800 rounded-xl p-4 flex items-center space-x-3 border border-zinc-700 hover:border-zinc-600 transition">
                  <img src={member.avatar} alt={member.username} className="w-12 h-12 rounded-full ring-2 ring-indigo-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{member.username}</p>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${onlineUsers.includes(member._id) ? 'bg-green-500' : 'bg-gray-500'
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