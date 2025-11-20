import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  initialize() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });
    }
    return this.socket;
  }

  connect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
      console.log('📤 Emitted:', event, data);
    } else {
      console.error('❌ Socket not connected, cannot emit:', event);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

const socketService = new SocketService();

export const initializeSocket = () => socketService.initialize();
export const connectSocket = () => socketService.connect();
export const disconnectSocket = () => socketService.disconnect();
export const getSocket = () => socketService.getSocket();

export default socketService;