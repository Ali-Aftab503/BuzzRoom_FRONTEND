import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { directMessagesAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import VideoCall from '../VideoCall/VideoCall';
import EmojiPicker from '../common/EmojiPicker';

const DirectMessageChat = () => {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [message, setMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = getSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchConversationData();

    if (socket) {
      socket.emit('join-dm', { conversationId, userId: user.id });

      socket.on('receive-dm', handleReceiveMessage);
      socket.on('dm-user-typing', () => setTyping(true));
      socket.on('dm-user-stop-typing', () => setTyping(false));
      socket.on('dm-message-updated', handleMessageUpdated);
      socket.on('dm-message-removed', handleMessageRemoved);
      socket.on('dm-reaction-added', handleReactionAdded);
      socket.on('incoming-call', handleIncomingCall);
      socket.on('call-rejected', handleCallRejected);
      socket.on('call-ended', handleCallEnded);

      return () => {
        socket.off('receive-dm', handleReceiveMessage);
        socket.off('dm-user-typing');
        socket.off('dm-user-stop-typing');
        socket.off('dm-message-updated', handleMessageUpdated);
        socket.off('dm-message-removed', handleMessageRemoved);
        socket.off('dm-reaction-added', handleReactionAdded);
        socket.off('incoming-call', handleIncomingCall);
        socket.off('call-rejected', handleCallRejected);
        socket.off('call-ended', handleCallEnded);
        socket.emit('leave-dm', { conversationId, userId: user.id });
      };
    }
  }, [conversationId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationData = async () => {
    try {
      const [conversationRes, messagesRes] = await Promise.all([
        directMessagesAPI.startConversation(conversationId.split('-')[1] || conversationId),
        directMessagesAPI.getMessages(conversationId)
      ]);

      setConversation(conversationRes.data.data.conversation);
      setMessages(messagesRes.data.data.messages);

      const other = conversationRes.data.data.conversation.participants.find(
        p => p._id !== user.id
      );
      setOtherUser(other);
    } catch (error) {
      console.error('Fetch conversation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveMessage = (messageData) => {
    setMessages(prev => [...prev, messageData]);
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

  const handleIncomingCall = ({ callId, callerId, callerName, type }) => {
    if (callerId === otherUser._id) {
      setIncomingCall({ callId, callerId, callerName, type });
    }
  };

  const handleCallRejected = () => {
    setActiveCall(null);
  };

  const handleCallEnded = () => {
    setActiveCall(null);
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('dm-typing', { conversationId, username: user.username });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('dm-stop-typing', { conversationId });
      }, 1000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const tempMessage = {
      _id: 'temp-' + Date.now(),
      conversation: conversationId,
      sender: {
        _id: user.id,
        username: user.username,
        avatar: user.avatar
      },
      receiver: otherUser,
      content: message,
      createdAt: new Date(),
      reactions: []
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessage('');

    try {
      if (socket) {
        socket.emit('send-dm', tempMessage);
      }

      await directMessagesAPI.sendMessage(conversationId, message);
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await directMessagesAPI.addReaction(conversationId, messageId, emoji);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? response.data.data.message : msg
      ));
      socket.emit('dm-add-reaction', { conversationId, messageId, reaction: { user: { _id: user.id, username: user.username, avatar: user.avatar }, emoji } });
    } catch (error) {
      console.error('Add reaction error:', error);
    }
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      const response = await directMessagesAPI.editMessage(conversationId, messageId, content);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? response.data.data.message : msg
      ));
      socket.emit('dm-message-edited', { conversationId, message: response.data.data.message });
      setEditingMessage(null);
    } catch (error) {
      console.error('Edit message error:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await directMessagesAPI.deleteMessage(conversationId, messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, deleted: true, content: 'This message was deleted' } : msg
      ));
      socket.emit('dm-message-deleted', { conversationId, messageId });
      setShowMessageMenu(null);
    } catch (error) {
      console.error('Delete message error:', error);
    }
  };

  const startCall = (type) => {
    const callId = `${user.id}-${otherUser._id}-${Date.now()}`;
    socket.emit('call-user', {
      callerId: user.id,
      receiverId: otherUser._id,
      callerName: user.username,
      roomId: conversationId,
      type
    });
    setActiveCall({ callId, isInitiator: true, otherUser, type });
  };

  const acceptCall = () => {
    if (incomingCall) {
      setActiveCall({ 
        callId: incomingCall.callId, 
        isInitiator: false, 
        otherUser,
        type: incomingCall.type
      });
      socket.emit('answer-call', { callId: incomingCall.callId, answer: true });
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('reject-call', { callId: incomingCall.callId });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupReactions = (reactions) => {
    const grouped = {};
    reactions.forEach(reaction => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = [];
      }
      grouped[reaction.emoji].push(reaction);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="text-zinc-300 text-xl font-semibold mt-4">Loading conversation...</p>
        </div>
      </div>
    );
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
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed top-4 right-4 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl z-50 animate-slideInRight">
          <p className="text-white font-semibold mb-2">
            {incomingCall.callerName} is calling...
          </p>
          <p className="text-zinc-400 text-sm mb-3">
            {incomingCall.type === 'video' ? '📹 Video Call' : '🎤 Voice Call'}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={acceptCall}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition"
            >
              Accept
            </button>
            <button
              onClick={rejectCall}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#18181b] border-b border-zinc-800 shadow-lg">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/direct-messages')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-3 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div className="flex items-center space-x-3 flex-1">
                <div className="relative">
                  <img
                    src={otherUser?.avatar}
                    alt={otherUser?.username}
                    className="w-12 h-12 rounded-full ring-2 ring-indigo-500"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#18181b]"></div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{otherUser?.username}</h2>
                  <p className="text-xs text-zinc-400">Online</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => startCall('video')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-3 rounded-xl transition"
                title="Video call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => startCall('audio')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-3 rounded-xl transition"
                title="Voice call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.sender._id === user.id;
          const groupedReactions = msg.reactions ? groupReactions(msg.reactions) : {};

          return (
            <div
              key={msg._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn group`}
            >
              <div className={`flex items-end space-x-2 max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <img
                  src={msg.sender.avatar}
                  alt={msg.sender.username}
                  className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-zinc-700"
                />

                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative`}>
                  {editingMessage === msg._id ? (
                    <div className="w-full">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleEditMessage(msg._id, editContent);
                        }}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleEditMessage(msg._id, editContent)}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMessage(null)}
                          className="px-3 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`relative px-4 py-3 rounded-2xl shadow-lg ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        } ${msg.deleted ? 'italic opacity-60' : ''}`}
                      >
                        {isOwnMessage && !msg.deleted && (
                          <button
                            onClick={() => setShowMessageMenu(showMessageMenu === msg._id ? null : msg._id)}
                            className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 bg-zinc-800 p-1 rounded-lg"
                          >
                            <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        )}

                        {showMessageMenu === msg._id && (
                          <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-10 min-w-32">
                            <button
                              onClick={() => {
                                setEditingMessage(msg._id);
                                setEditContent(msg.content);
                                setShowMessageMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}

                        <p className="break-words leading-relaxed">{msg.content}</p>
                        {msg.edited && !msg.deleted && (
                          <span className="text-xs opacity-70 ml-2">(edited)</span>
                        )}

                        {/* URL Previews */}
                        {msg.urlPreviews && msg.urlPreviews.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.urlPreviews.map((preview, idx) => (
                              <a
                                key={idx}
                                href={preview.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-zinc-900/50 rounded-lg p-3 hover:bg-zinc-900/70 transition border border-zinc-700"
                              >
                                {preview.image && (
                                  <img src={preview.image} alt={preview.title} className="w-full h-40 object-cover rounded-lg mb-2" />
                                )}
                                {preview.title && (
                                  <p className="font-semibold text-sm text-white mb-1">{preview.title}</p>
                                )}
                                {preview.description && (
                                  <p className="text-xs text-zinc-400 line-clamp-2">{preview.description}</p>
                                )}
                              </a>
                            ))}
                          </div>
                        )}

                        {Object.keys(groupedReactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg._id, emoji)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                                  reactions.some(r => r.user._id === user.id)
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-700 text-zinc-300'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{reactions.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {!msg.deleted && (
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                            className="absolute -bottom-6 right-2 opacity-0 group-hover:opacity-100 bg-zinc-800 p-1.5 rounded-lg"
                          >
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}

                        {showEmojiPicker === msg._id && (
                          <div className="relative">
                            <EmojiPicker
                              onEmojiSelect={(emoji) => {
                                handleReaction(msg._id, emoji);
                                setShowEmojiPicker(null);
                              }}
                              onClose={() => setShowEmojiPicker(null)}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 px-2 mt-1">{formatTime(msg.createdAt)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex items-center space-x-3 animate-fadeIn">
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3">
              <div className="flex space-x-2">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
            <span className="text-sm text-zinc-500 italic">{otherUser?.username} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#18181b] border-t border-zinc-800">
        <form onSubmit={handleSendMessage} className="px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-3 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(showEmojiPicker === 'input' ? null : 'input')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-3 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showEmojiPicker === 'input' && (
                <EmojiPicker
                  onEmojiSelect={(emoji) => {
                    setMessage(prev => prev + emoji);
                    setShowEmojiPicker(null);
                  }}
                  onClose={() => setShowEmojiPicker(null)}
                />
              )}
            </div>

            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectMessageChat;