import { useState, useRef, useEffect } from 'react';
import EmojiPicker from '../common/EmojiPicker';
import { Send, Smile, Paperclip, X } from 'lucide-react';

const MessageInput = ({ onSendMessage, onTyping, onStopTyping, disabled }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      onStopTyping();
      setShowEmojiPicker(false);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onTyping();

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1000);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Send the base64 string as the message content with type 'image'
        onSendMessage(reader.result, 'image');
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="relative">
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-4 z-50 animate-fadeIn">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-zinc-700 text-zinc-400 hover:text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <form onSubmit={handleSubmit} className="flex items-end space-x-2 bg-zinc-900 p-2 rounded-3xl border border-zinc-800 shadow-lg">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-3 rounded-full transition-all duration-200 shrink-0 ${showEmojiPicker
            ? 'bg-indigo-500/20 text-indigo-400'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          disabled={disabled}
        >
          <Smile className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-200 shrink-0 hidden sm:block"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 py-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={disabled ? "Connecting..." : "Type a message..."}
            className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none resize-none max-h-32 min-h-[24px] py-1 px-2"
            rows={1}
            disabled={disabled}
          />
        </div>

        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={`p-3 rounded-full transition-all duration-200 shrink-0 ${message.trim() && !disabled
            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transform hover:scale-105'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;