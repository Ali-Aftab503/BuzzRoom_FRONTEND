import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import RoomList from './components/Rooms/RoomList';
import ChatRoom from './components/Chat/ChatRoom';
import DirectMessageList from './components/DirectMessages/DirectMessageList';
import DirectMessageChat from './components/DirectMessages/DirectMessageChat';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="text-zinc-300 text-xl font-semibold mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="text-zinc-300 text-xl font-semibold mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/rooms" />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <RoomList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:roomId"
          element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/direct-messages"
          element={
            <ProtectedRoute>
              <DirectMessageList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dm/:conversationId"
          element={
            <ProtectedRoute>
              <DirectMessageChat />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/rooms" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;