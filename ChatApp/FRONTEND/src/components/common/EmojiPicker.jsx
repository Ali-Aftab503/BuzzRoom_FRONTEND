import { useState } from 'react';

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');

  const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    gestures: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🙏', '✍️', '👏', '🙌'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗'],
    food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🥫'],
    travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '✈️', '🚀', '🛸', '🚁', '⛵', '🚤', '⛴️'],
    objects: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️'],
    symbols: ['❤️', '💔', '💯', '💢', '💬', '💭', '💤', '💮', '♨️', '💈', '🛑', '🕛', '⏰', '⏱️', '⏲️', '🕰️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿']
  };

  const categoryIcons = {
    smileys: '😊',
    gestures: '👋',
    hearts: '❤️',
    animals: '🐶',
    food: '🍕',
    travel: '✈️',
    objects: '💻',
    symbols: '♨️'
  };

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-80 z-50 animate-scaleIn">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-700">
        <h3 className="text-white font-semibold text-sm">Pick an emoji</h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-around p-2 border-b border-zinc-700 bg-zinc-800/50">
        {Object.keys(categoryIcons).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`p-2 rounded-lg text-2xl transition-all ${
              activeCategory === category
                ? 'bg-indigo-600 scale-110'
                : 'hover:bg-zinc-700'
            }`}
            title={category}
          >
            {categoryIcons[category]}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
        {emojiCategories[activeCategory].map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="text-2xl p-2 rounded-lg hover:bg-zinc-700 transition-all hover:scale-125"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;