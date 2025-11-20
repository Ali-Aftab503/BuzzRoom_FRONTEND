import { useEffect, useRef, useState } from 'react';
import EmojiPicker from '../common/EmojiPicker';

const MessageList = ({ messages, currentUserId, typing, onReaction, onEdit, onDelete }) => {
  const messagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      const date = formatDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const handleEmojiSelect = (messageId, emoji) => {
    onReaction(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const startEdit = (message) => {
    setEditingMessage(message._id);
    setEditContent(message.content);
    setShowMessageMenu(null);
  };

  const saveEdit = (messageId) => {
    if (editContent.trim() && editContent !== messages.find(m => m._id === messageId)?.content) {
      onEdit(messageId, editContent);
    }
    setEditingMessage(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleDelete = (messageId) => {
    onDelete(messageId);
    setShowMessageMenu(null);
  };

  const messageGroups = groupMessagesByDate(messages);

  // Group reactions by emoji
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

  // Check if message should show avatar (first in sequence from sender)
  const shouldShowAvatar = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    if (previousMessage.messageType === 'system') return true;
    if (currentMessage.messageType === 'system') return false;
    return previousMessage.sender._id !== currentMessage.sender._id;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 chat-scroll">
      <div className="max-w-4xl mx-auto">
        {Object.keys(messageGroups).map((date) => (
          <div key={date}>
            <div className="flex items-center justify-center my-6">
              <div className="bg-zinc-800 px-4 py-2 rounded-full border border-zinc-700">
                <span className="text-xs font-semibold text-zinc-400">{date}</span>
              </div>
            </div>

            {messageGroups[date].map((message, index) => {
              if (message.messageType === 'system') {
                return (
                  <div key={message._id} className="text-center my-4 animate-fadeIn">
                    <div className="inline-flex items-center space-x-2 bg-zinc-800 px-4 py-2 rounded-full border border-zinc-700">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-zinc-400">{message.content}</span>
                    </div>
                  </div>
                );
              }

              const isOwnMessage = message.sender._id === currentUserId;
              const groupedReactions = message.reactions ? groupReactions(message.reactions) : {};
              const previousMessage = index > 0 ? messageGroups[date][index - 1] : null;
              const showAvatar = shouldShowAvatar(message, previousMessage);
              const nextMessage = index < messageGroups[date].length - 1 ? messageGroups[date][index + 1] : null;
              const isLastInSequence = !nextMessage || shouldShowAvatar(nextMessage, message);

              return (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'} animate-fadeIn group`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className={`flex items-end space-x-2 max-w-[85%] sm:max-w-md lg:max-w-lg ${
                      isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {/* Avatar - only show for first message in sequence */}
                    {showAvatar ? (
                      <img
                        src={message.sender.avatar}
                        alt={message.sender.username}
                        className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-zinc-700"
                        title={message.sender.username}
                      />
                    ) : (
                      <div className="w-8 h-8 flex-shrink-0"></div>
                    )}

                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative flex-1`}>
                      {/* Username - only show for first message in sequence and not own messages */}
                      {!isOwnMessage && showAvatar && (
                        <div className="flex items-center space-x-2 mb-1 px-1">
                          <p className="text-xs font-semibold text-indigo-400">
                            {message.sender.username}
                          </p>
                        </div>
                      )}

                      {editingMessage === message._id ? (
                        <div className="w-full">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') saveEdit(message._id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-2xl focus:outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => saveEdit(message._id)}
                              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-xs rounded-lg hover:bg-zinc-600 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`relative px-4 py-2.5 shadow-lg transition-all duration-200 ${
                              isOwnMessage
                                ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                                : 'bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-2xl rounded-bl-md'
                            } ${message.status === 'failed' ? 'opacity-50' : ''} ${message.deleted ? 'italic opacity-60' : ''}`}
                          >
                            {/* Message menu button */}
                            {isOwnMessage && !message.deleted && (
                              <button
                                onClick={() => setShowMessageMenu(showMessageMenu === message._id ? null : message._id)}
                                className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 bg-zinc-800 p-1.5 rounded-lg hover:bg-zinc-700 transition"
                              >
                                <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            )}

                            {/* Message menu dropdown */}
                            {showMessageMenu === message._id && (
                              <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-10 min-w-32">
                                <button
                                  onClick={() => startEdit(message)}
                                  className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center space-x-2 rounded-t-lg"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(message._id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center space-x-2 rounded-b-lg"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}

                            <p className="break-words leading-relaxed text-[15px]">{message.content}</p>

                            {message.edited && !message.deleted && (
                              <span className="text-xs opacity-70 ml-2">(edited)</span>
                            )}

                            {/* URL Previews */}
                            {message.urlPreviews && message.urlPreviews.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.urlPreviews.map((preview, idx) => (
                                  <a
                                    key={idx}
                                    href={preview.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block bg-zinc-900 rounded-xl p-3 hover:bg-zinc-800/80 transition border border-zinc-700"
                                  >
                                    {preview.image && (
                                      <img
                                        src={preview.image}
                                        alt={preview.title}
                                        className="w-full h-40 object-cover rounded-lg mb-2"
                                      />
                                    )}
                                    {preview.title && (
                                      <p className="font-semibold text-sm text-white mb-1">{preview.title}</p>
                                    )}
                                    {preview.description && (
                                      <p className="text-xs text-zinc-400 line-clamp-2">{preview.description}</p>
                                    )}
                                    {preview.siteName && (
                                      <p className="text-xs text-zinc-500 mt-1">{preview.siteName}</p>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Reactions */}
                            {Object.keys(groupedReactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleEmojiSelect(message._id, emoji)}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition ${
                                      reactions.some(r => r.user._id === currentUserId)
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                    }`}
                                    title={reactions.map(r => r.user.username).join(', ')}
                                  >
                                    <span>{emoji}</span>
                                    <span>{reactions.length}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Add reaction button */}
                            {!message.deleted && (
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                                className="absolute -bottom-6 right-2 opacity-0 group-hover:opacity-100 bg-zinc-800 p-1.5 rounded-lg hover:bg-zinc-700 transition"
                              >
                                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}

                            {showEmojiPicker === message._id && (
                              <div className="relative">
                                <EmojiPicker
                                  onEmojiSelect={(emoji) => handleEmojiSelect(message._id, emoji)}
                                  onClose={() => setShowEmojiPicker(null)}
                                />
                              </div>
                            )}
                          </div>

                          {/* Timestamp - only show on last message in sequence */}
                          {isLastInSequence && (
                            <div className="flex items-center space-x-2 px-1 mt-1">
                              <p className="text-xs text-zinc-500">
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {typing && (
          <div className="flex items-center space-x-3 mt-4 animate-fadeIn">
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-md px-5 py-3">
              <div className="flex space-x-2">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
            <span className="text-sm text-zinc-500 italic">{typing}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;