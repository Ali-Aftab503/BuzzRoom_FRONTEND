import { useEffect, useRef } from 'react';

const MessageList = ({ messages, currentUserId, typing, onRetry }) => {
  const messagesEndRef = useRef(null);

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

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 chat-scroll">
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

            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className={`flex items-end space-x-2 max-w-md sm:max-w-lg lg:max-w-xl ${
                    isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <img
                    src={message.sender.avatar}
                    alt={message.sender.username}
                    className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-zinc-700"
                    title={message.sender.username}
                  />

                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {!isOwnMessage && (
                      <div className="flex items-center space-x-2 mb-1 px-2">
                        <p className="text-xs font-semibold text-indigo-400">
                          {message.sender.username}
                        </p>
                      </div>
                    )}

                    <div
                      className={`px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                      } ${message.status === 'failed' ? 'opacity-50' : ''}`}
                    >
                      <p className="break-words leading-relaxed">{message.content}</p>
                    </div>

                    <div className="flex items-center space-x-2 px-2 mt-1">
                      <p className="text-xs text-zinc-500">
                        {formatTime(message.createdAt)}
                      </p>
                      {message.status === 'failed' && onRetry && (
                        <button
                          onClick={() => onRetry(message._id)}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {typing && (
        <div className="flex items-center space-x-3 mb-4 animate-fadeIn">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3">
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
  );
};

export default MessageList;