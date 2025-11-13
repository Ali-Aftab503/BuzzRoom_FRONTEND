import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { directMessagesAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const DirectMessageChat = () => {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [message, setMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);

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

      return () => {
        socket.off('receive-dm', handleReceiveMessage);
        socket.off('dm-user-typing');
        socket.off('dm-user-stop-typing');
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
      createdAt: new Date()
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="bg-[#18181b] border-b border-zinc-800 shadow-lg">
        <div className="px-4 sm:px-6 py-4">
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
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.sender._id === user.id;

          return (
            <div
              key={msg._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`flex items-end space-x-2 max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <img
                  src={msg.sender.avatar}
                  alt={msg.sender.username}
                  className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-zinc-700"
                />

                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    }`}
                  >
                    <p className="break-words leading-relaxed">{msg.content}</p>
                  </div>
                  <p className="text-xs text-zinc-500 px-2 mt-1">{formatTime(msg.createdAt)}</p>
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
          <div className="flex items-center space-x-3">
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