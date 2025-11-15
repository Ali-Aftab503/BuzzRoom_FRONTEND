import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Room APIs
export const roomAPI = {
  getAllRooms: () => api.get('/rooms'),
  getRoom: (id) => api.get(`/rooms/${id}`),
  createRoom: (roomData) => api.post('/rooms', roomData),
  joinRoom: (id) => api.post(`/rooms/${id}/join`),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
};

// Message APIs
export const messageAPI = {
  getMessages: (roomId) => api.get(`/messages/${roomId}`),
  sendMessage: (messageData) => api.post('/messages', messageData),
  editMessage: (messageId, content) => api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/reactions`, { emoji }),
};

// Favorites APIs
export const favoritesAPI = {
  getFavorites: () => api.get('/favorites'),
  addFavorite: (roomId) => api.post(`/favorites/${roomId}`),
  removeFavorite: (roomId) => api.delete(`/favorites/${roomId}`),
  checkFavorite: (roomId) => api.get(`/favorites/check/${roomId}`),
};

// Direct Messages APIs
export const directMessagesAPI = {
  getConversations: () => api.get('/direct-messages'),
  startConversation: (receiverId) => api.post('/direct-messages/start', { receiverId }),
  getMessages: (conversationId) => api.get(`/direct-messages/${conversationId}/messages`),
  sendMessage: (conversationId, content) => api.post(`/direct-messages/${conversationId}/messages`, { content }),
  editMessage: (conversationId, messageId, content) => api.put(`/direct-messages/${conversationId}/messages/${messageId}`, { content }),
  deleteMessage: (conversationId, messageId) => api.delete(`/direct-messages/${conversationId}/messages/${messageId}`),
  addReaction: (conversationId, messageId, emoji) => api.post(`/direct-messages/${conversationId}/messages/${messageId}/reactions`, { emoji }),
  searchUsers: (query) => api.get('/direct-messages/users/search', { params: { query } }),
};

// Settings APIs
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
  updateProfile: (profile) => api.put('/settings/profile', profile),
};

export default api;