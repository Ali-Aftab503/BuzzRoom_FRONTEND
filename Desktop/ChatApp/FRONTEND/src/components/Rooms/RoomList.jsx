import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI, favoritesAPI, settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CreateRoomModal from './CreateRoomModal';
import { getSocket } from '../../services/socket';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [roomOnlineCounts, setRoomOnlineCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    soundEffects: false
  });

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const socket = getSocket();

  useEffect(() => {
    fetchData();
    fetchSettings();
    
    // Listen for real-time online count updates
    if (socket) {
      // Update from specific rooms
      socket.on('room-users-updated', ({ roomId, onlineCount }) => {
        setRoomOnlineCounts(prev => ({
          ...prev,
          [roomId]: onlineCount
        }));
      });

      // CRITICAL FIX: Listen for global updates (when viewing room list)
      socket.on('global-room-update', ({ roomId, onlineCount }) => {
        setRoomOnlineCounts(prev => ({
          ...prev,
          [roomId]: onlineCount
        }));
      });
    }

    return () => {
      if (socket) {
        socket.off('room-users-updated');
        socket.off('global-room-update');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [roomsResponse, favoritesResponse] = await Promise.all([
        roomAPI.getAllRooms(),
        favoritesAPI.getFavorites()
      ]);
      
      const roomsData = roomsResponse.data.data.rooms;
      setRooms(roomsData);
      setFavoriteRooms(favoritesResponse.data.data.favoriteRooms);
      
      // Initialize online counts (default to 0, will be updated by socket)
      const initialCounts = {};
      roomsData.forEach(room => {
        initialCounts[room._id] = room.onlineCount || 0;
      });
      setRoomOnlineCounts(initialCounts);
      
      // Create a Set of favorite room IDs for quick lookup
      const favIds = new Set(
        favoritesResponse.data.data.favoriteRooms.map(room => room._id)
      );
      setFavoriteIds(favIds);
    } catch (error) {
      console.error('Fetch data error:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      setSettings(response.data.data.settings);
    } catch (error) {
      console.error('Fetch settings error:', error);
    }
  };

  const handleSettingChange = async (setting, value) => {
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);

    try {
      await settingsAPI.updateSettings(newSettings);
    } catch (error) {
      console.error('Update settings error:', error);
      // Revert on error
      setSettings(settings);
    }
  };

  const handleCreateRoom = async (roomData) => {
    const response = await roomAPI.createRoom(roomData);
    const newRoom = response.data.data.room;
    setRooms([newRoom, ...rooms]);
    setRoomOnlineCounts(prev => ({ ...prev, [newRoom._id]: 0 }));
    setShowModal(false);
    navigate(`/chat/${newRoom._id}`);
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await roomAPI.joinRoom(roomId);
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error('Join room error:', error);
      navigate(`/chat/${roomId}`);
    }
  };

  const handleToggleFavorite = async (roomId, e) => {
    e.stopPropagation();
    
    try {
      if (favoriteIds.has(roomId)) {
        await favoritesAPI.removeFavorite(roomId);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(roomId);
          return newSet;
        });
        setFavoriteRooms(prev => prev.filter(room => room._id !== roomId));
      } else {
        const response = await favoritesAPI.addFavorite(roomId);
        setFavoriteIds(prev => new Set(prev).add(roomId));
        setFavoriteRooms(response.data.data.favoriteRooms);
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      setError(error.response?.data?.message || 'Failed to update favorites');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const RoomCard = ({ room, isFavorite }) => {
    const onlineCount = roomOnlineCounts[room._id] || 0;
    
    return (
      <div
        className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 animate-fadeIn relative"
        onClick={() => handleJoinRoom(room._id)}
      >
        {/* Favorite Button */}
        <button
          onClick={(e) => handleToggleFavorite(room._id, e)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-700 transition-colors z-10"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg 
            className={`w-6 h-6 transition-colors ${
              isFavorite 
                ? 'fill-yellow-500 text-yellow-500' 
                : 'fill-none text-zinc-500 hover:text-yellow-500'
            }`}
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
            />
          </svg>
        </button>

        <div className="flex items-start justify-between mb-4 pr-10">
          <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div className="flex items-center space-x-2 bg-zinc-800/50 px-3 py-1 rounded-full">
            <div className={`w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-xs text-zinc-300 font-medium">{onlineCount} online</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
          {room.name}
        </h3>
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2 h-10">
          {room.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <img
              src={room.creator.avatar}
              alt={room.creator.username}
              className="w-7 h-7 rounded-full ring-2 ring-zinc-700 flex-shrink-0"
            />
            <span className="text-xs text-zinc-400 font-medium truncate">{room.creator.username}</span>
          </div>
          <div className="bg-indigo-500/10 p-2 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="text-zinc-300 text-xl font-semibold mt-4">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#18181b] p-3 rounded-xl border border-zinc-800 text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#18181b] border-r border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center logo-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">ChatApp</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => handleNavClick('all')}
            className={`sidebar-item w-full ${activeTab === 'all' ? 'active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>All Rooms</span>
            <span className="ml-auto badge">{rooms.length}</span>
          </button>

          <button
            onClick={() => handleNavClick('favorites')}
            className={`sidebar-item w-full ${activeTab === 'favorites' ? 'active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Favorites</span>
            {favoriteRooms.length > 0 && (
              <span className="ml-auto badge">{favoriteRooms.length}</span>
            )}
          </button>

          <button
            onClick={() => navigate('/direct-messages')}
            className={`sidebar-item w-full`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Direct Messages</span>
          </button>

          <button
            onClick={() => handleNavClick('settings')}
            className={`sidebar-item w-full ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={user?.avatar}
              alt={user?.username}
              className="w-10 h-10 rounded-full ring-2 ring-indigo-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{user?.username}</p>
              <div className="flex items-center">
                <div className="status-online mr-1"></div>
                <p className="text-xs text-zinc-400">Online</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-secondary-dark w-full text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full lg:w-auto overflow-y-auto">
        {/* Header */}
        <div className="bg-[#18181b] border-b border-zinc-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ml-16 lg:ml-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {activeTab === 'all' ? 'Chat Rooms' : 
                 activeTab === 'favorites' ? 'Favorites' :
                 activeTab === 'direct' ? 'Direct Messages' :
                 'Settings'}
              </h2>
              <p className="text-zinc-400 mt-1 text-sm">
                {activeTab === 'all' ? `${rooms.length} rooms available` :
                 activeTab === 'favorites' ? `${favoriteRooms.length} favorite rooms` :
                 activeTab === 'direct' ? 'Your direct conversations' :
                 'Manage your account settings'}
              </p>
            </div>
            {activeTab === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary-dark inline-flex items-center space-x-2 w-full sm:w-auto justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Room</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 animate-slideIn">
              {error}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <>
              {favoriteRooms.length === 0 ? (
                <div className="text-center py-12 sm:py-20">
                  <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Favorites Yet</h3>
                    <p className="text-zinc-400 text-sm sm:text-base mb-4">Mark rooms as favorites to see them here</p>
                    <button
                      onClick={() => handleNavClick('all')}
                      className="btn-primary-dark w-full sm:w-auto"
                    >
                      Browse Rooms
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {favoriteRooms.map((room) => (
                    <RoomCard key={room._id} room={room} isFavorite={true} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 sm:p-6 mb-4">
                <h3 className="text-lg font-bold text-white mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-800 rounded-xl gap-4">
                    <div className="flex items-center space-x-3">
                      <img src={user?.avatar} alt={user?.username} className="w-12 h-12 rounded-full ring-2 ring-indigo-500" />
                      <div>
                        <p className="text-white font-semibold">{user?.username}</p>
                        <p className="text-sm text-zinc-400 break-all">{user?.email}</p>
                      </div>
                    </div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition w-full sm:w-auto">
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-700 transition">
                    <span className="text-white">Notifications</span>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-indigo-600 rounded" 
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-700 transition">
                    <span className="text-white">Dark Mode</span>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-indigo-600 rounded" 
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-700 transition">
                    <span className="text-white">Sound Effects</span>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-indigo-600 rounded" 
                      checked={settings.soundEffects}
                      onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Direct Messages Tab */}
          {activeTab === 'direct' && (
            <div className="text-center py-12 sm:py-20">
              <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Direct Messages</h3>
                <p className="text-zinc-400 text-sm sm:text-base mb-4">Direct messaging feature coming soon!</p>
                <p className="text-zinc-500 text-xs">We're working on bringing you 1-on-1 conversations</p>
              </div>
            </div>
          )}

          {/* All Rooms Tab */}
          {activeTab === 'all' && (
            <>
              {rooms.length === 0 ? (
                <div className="text-center py-12 sm:py-20">
                  <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Rooms Yet</h3>
                    <p className="text-zinc-400 mb-6 text-sm sm:text-base">Create your first room to start chatting</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="btn-primary-dark w-full sm:w-auto"
                    >
                      Create Room
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <RoomCard 
                      key={room._id} 
                      room={room} 
                      isFavorite={favoriteIds.has(room._id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
};

export default RoomList;