import { useState } from 'react';

const CreateRoomModal = ({ isOpen, onClose, onCreateRoom }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Room name is required');
      return;
    }

    if (formData.name.length < 3) {
      setError('Room name must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      await onCreateRoom(formData);
      setFormData({
        name: '',
        description: '',
        isPrivate: false,
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      isPrivate: false,
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="glass-dark rounded-2xl max-w-md w-full animate-scaleIn border border-zinc-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Room</h2>
                <p className="text-indigo-100 text-sm">Start a new conversation</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 animate-slideInLeft">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Room Name */}
          <div className="mb-5">
            <label className="block text-zinc-300 text-sm font-semibold mb-2">
              Room Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-dark w-full"
              placeholder="e.g., General Chat, Tech Talk"
              maxLength={50}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-zinc-500">Choose a descriptive name</p>
              <p className="text-xs text-zinc-400">{formData.name.length}/50</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-zinc-300 text-sm font-semibold mb-2">
              Description <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-dark w-full resize-none"
              placeholder="What's this room about?"
              rows="3"
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-zinc-500">Brief description</p>
              <p className="text-xs text-zinc-400">{formData.description.length}/200</p>
            </div>
          </div>

          {/* Private Room Toggle */}
          <div className="mb-6">
            <label className="flex items-center space-x-4 cursor-pointer glass-darker p-4 rounded-xl border border-zinc-700 hover:border-zinc-600 transition">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-600 border-zinc-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-white font-semibold">Private Room</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Only invited members can join
                </p>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary-dark flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-dark flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;