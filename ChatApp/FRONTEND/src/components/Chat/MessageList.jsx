import { useEffect, useRef, useState } from 'react';
import EmojiPicker from '../common/EmojiPicker';
import {
  Smile,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react';

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

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 chat-scroll pb-24 sm:pb-6">
      {Object.keys(messageGroups).map((date) => (
        <div key={date}>
          <div className="flex items-center justify-center my-6">
            <div className="bg-zinc-800 px-4 py-2 rounded-full border border-zinc-700 shadow-sm">
              <span className="text-xs font-semibold text-zinc-400">{date}</span>
            </div>
          </div>

          {messageGroups[date].map((message, index) => {
            if (message.messageType === 'system') {
              return (
                <div key={message._id} className="text-center my-4 animate-fadeIn">
                  <div className="inline-flex items-center space-x-2 bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700/50">
                    <span className="text-sm text-zinc-400">{message.content}</span>
                  </div>
                </div>
              );
            }

            const isOwnMessage = message.sender._id === currentUserId;
            const groupedReactions = message.reactions ? groupReactions(message.reactions) : {};

            // Check if previous message exists and was from the same sender
            const previousMessage = index > 0 ? messageGroups[date][index - 1] : null;
            const isConsecutive = previousMessage &&
              previousMessage.sender._id === message.sender._id &&
              previousMessage.messageType !== 'system';

            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'} animate-fadeIn group`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className={`flex items-end space-x-2 max-w-[85%] sm:max-w-lg lg:max-w-xl ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                >
                  {/* Avatar - only show if not consecutive or if it's the first message of the group */}
                  {!isConsecutive ? (
                    <img
                      src={message.sender.avatar}
                      alt={message.sender.username}
                      className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-zinc-700 mb-1"
                      title={message.sender.username}
                    />
                  ) : (
                    <div className="w-8 flex-shrink-0" /> // Spacer for alignment
                  )}

                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative min-w-0`}>
                    {!isOwnMessage && !isConsecutive && (
                      <div className="flex items-center space-x-2 mb-1 px-2">
                        <p className="text-xs font-semibold text-indigo-400 truncate max-w-[150px]">
                          {message.sender.username}
                        </p>
                      </div>
                    )}

                    {editingMessage === message._id ? (
                      <div className="w-full min-w-[200px]">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') saveEdit(message._id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl focus:outline-none focus:border-indigo-500"
                          autoFocus
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => saveEdit(message._id)}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500 flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-lg hover:bg-zinc-600 flex items-center space-x-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`relative px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 ${isOwnMessage
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                            : 'bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-bl-none'
                            } ${message.status === 'failed' ? 'opacity-50' : ''} ${message.deleted ? 'italic opacity-60' : ''}`}
                        >
                          {/* Message menu button */}
                          {isOwnMessage && !message.deleted && (
                            <button
                              onClick={() => setShowMessageMenu(showMessageMenu === message._id ? null : message._id)}
                              className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 bg-zinc-800 p-1 rounded-lg hover:bg-zinc-700 transition border border-zinc-700 shadow-lg"
                            >
                              <MoreVertical className="w-4 h-4 text-zinc-400" />
                            </button>
                          )}

                          {/* Message menu dropdown */}
                          {showMessageMenu === message._id && (
                            <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-10 min-w-32 overflow-hidden">
                              <button
                                onClick={() => startEdit(message)}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center space-x-2 transition"
                              >
                                <Edit2 className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(message._id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center space-x-2 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}

                          {message.messageType === 'image' ? (
                            <div className="relative group/image">
                              <img
                                src={message.content}
                                alt="Attachment"
                                className="max-w-full rounded-lg max-h-64 sm:max-h-80 object-cover cursor-pointer hover:opacity-90 transition"
                                onClick={() => window.open(message.content, '_blank')}
                              />
                            </div>
                          ) : (
                            <p className="break-words leading-relaxed whitespace-pre-wrap text-[15px]">{message.content}</p>
                          )}

                          {message.edited && !message.deleted && (
                            <span className="text-[10px] opacity-70 ml-2 block text-right mt-1">(edited)</span>
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
                                  className="block bg-black/20 rounded-lg p-3 hover:bg-black/30 transition border border-white/10"
                                >
                                  {preview.image && (
                                    <img
                                      src={preview.image}
                                      alt={preview.title}
                                      className="w-full h-32 sm:h-40 object-cover rounded-lg mb-2"
                                    />
                                  )}
                                  {preview.title && (
                                    <p className="font-semibold text-sm mb-1 line-clamp-1">{preview.title}</p>
                                  )}
                                  {preview.description && (
                                    <p className="text-xs opacity-70 line-clamp-2">{preview.description}</p>
                                  )}
                                  {preview.siteName && (
                                    <p className="text-[10px] opacity-50 mt-1 uppercase tracking-wider">{preview.siteName}</p>
                                  )}
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Reactions */}
                          {Object.keys(groupedReactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/10">
                              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleEmojiSelect(message._id, emoji)}
                                  className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] transition ${reactions.some(r => r.user._id === currentUserId)
                                    ? 'bg-indigo-500/30 text-white border border-indigo-500/50'
                                    : 'bg-black/20 text-zinc-300 hover:bg-black/30 border border-white/10'
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
                              className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 bg-zinc-800 p-1.5 rounded-lg hover:bg-zinc-700 transition border border-zinc-700 shadow-lg"
                            >
                              <Smile className="w-4 h-4 text-zinc-400" />
                            </button>
                          )}

                          {showEmojiPicker === message._id && (
                            <div className="relative z-20">
                              <EmojiPicker
                                onEmojiSelect={(emoji) => handleEmojiSelect(message._id, emoji)}
                                onClose={() => setShowEmojiPicker(null)}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 px-2 mt-1">
                          <p className="text-[10px] text-zinc-500">
                            {formatTime(message.createdAt)}
                          </p>
                          {isOwnMessage && (
                            <span className="text-[10px]">
                              {message.status === 'sending' && <span className="text-zinc-500">Sending...</span>}
                              {message.status === 'sent' && <span className="text-zinc-400">Sent</span>}
                              {message.status === 'delivered' && <span className="text-zinc-400">Delivered</span>}
                              {message.status === 'read' && <span className="text-indigo-400">Read</span>}
                              {message.status === 'failed' && <span className="text-red-400">Failed</span>}
                            </span>
                          )}
                        </div>
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
        <div className="flex items-center space-x-3 mb-4 animate-fadeIn px-2">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 rounded-bl-none">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          <span className="text-xs text-zinc-500 italic">{typing}</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;