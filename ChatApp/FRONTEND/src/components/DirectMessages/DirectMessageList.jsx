import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { directMessagesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DirectMessageList = () => {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await directMessagesAPI.getConversations();
      setConversations(response.data.data.conversations);
      setError('');
    } catch (error) {
      console.error('Fetch conversations error:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await directMessagesAPI.searchUsers(query);
      setSearchResults(response.data.data.users);
      setError('');
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleStartConversation = async (receiverId) => {
    try {
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      
      const response = await directMessagesAPI.startConversation(receiverId);
      navigate(`/dm/${response.data.data.conversation._id}`);
    } catch (error) {
      console.error('Start conversation error:', error);
      setError('Failed to start conversation');
    }
  };

  const getOtherParticipant = (participants) => {
    return participants.find(p => p._id !== user.id);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="text-zinc-300 text-xl font-semibold mt-4">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="bg-[#18181b] border-b border-zinc-800 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/rooms')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-3 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Direct Messages</h2>
                <p className="text-zinc-400 text-sm">{conversations.length} conversations</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="btn-primary-dark inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Search */}
          {showNewChat && (
            <div className="animate-slideIn">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users by username or email..."
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-3 bg-zinc-800 border border-zinc-700 rounded-xl max-h-60 overflow-y-auto">
                  {searchResults.map((searchUser) => (
                    <div
                      key={searchUser._id}
                      onClick={() => handleStartConversation(searchUser._id)}
                      className="flex items-center space-x-3 p-4 hover:bg-zinc-700 cursor-pointer transition"
                    >
                      <img src={searchUser.avatar} alt={searchUser.username} className="w-10 h-10 rounded-full ring-2 ring-indigo-500" />
                      <div>
                        <p className="text-white font-semibold">{searchUser.username}</p>
                        <p className="text-zinc-400 text-sm">{searchUser.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searching && (
                <div className="mt-3 text-center text-zinc-400 py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="mt-2">Searching...</p>
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <div className="mt-3 text-center text-zinc-400 py-4 bg-zinc-800 rounded-xl">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {conversations.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Conversations Yet</h3>
              <p className="text-zinc-400 text-sm sm:text-base mb-4">Start a new conversation with someone</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="btn-primary-dark w-full sm:w-auto"
              >
                Start Chatting
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation.participants);
              const unreadCount = conversation.unreadCount?.get?.(user.id) || 
                                 conversation.unreadCount?.[user.id] || 0;

              return (
                <div
                  key={conversation._id}
                  onClick={() => navigate(`/dm/${conversation._id}`)}
                  className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-indigo-500 transition-all duration-200 animate-fadeIn"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={otherUser?.avatar}
                        alt={otherUser?.username}
                        className="w-14 h-14 rounded-full ring-2 ring-zinc-700"
                      />
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#18181b]"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-bold truncate">{otherUser?.username}</h3>
                        {conversation.lastMessage?.timestamp && (
                          <span className="text-xs text-zinc-500 ml-2">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-zinc-400 text-sm truncate">
                          {conversation.lastMessage?.content || 'Start a conversation'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2 flex-shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessageList;