import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';
import { initializeSocket, connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
  try {
    const response = await authAPI.getMe();
    setUser(response.data.data.user);
    
    // Initialize socket connection
    const socket = initializeSocket();
    connectSocket();
    
    // Wait for connection
    setTimeout(() => {
      if (socket.connected) {
        console.log('📡 Emitting user-connected for:', response.data.data.user.id);
        socket.emit('user-connected', response.data.data.user.id);
        console.log('✅ Socket connected and user registered');
      } else {
        console.error('❌ Socket not connected');
      }
    }, 500); // Increased timeout to 500ms
  } catch (error) {
    console.error('Load user error:', error);
    logout();
  } finally {
    setLoading(false);
  }
};

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      // Initialize socket connection
      const socket = initializeSocket();
      connectSocket();
      
      setTimeout(() => {
        socket.emit('user-connected', user.id);
        console.log('✅ Socket connected on login');
      }, 100);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      // Initialize socket connection
      const socket = initializeSocket();
      connectSocket();
      
      setTimeout(() => {
        socket.emit('user-connected', user.id);
        console.log('✅ Socket connected on register');
      }, 100);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};