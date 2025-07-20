import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';

const ConfirmationDialog = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">⚠️ Warning</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Exit Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ user, onLoginClick, onSignupClick, onLogout, onGroupTaskClick, onProfileClick, isGuestMode, notifications, setNotifications }) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.hamburger-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);
  
  const handleExitGuestClick = () => {
    setShowExitConfirm(true);
  };
  
  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onLogout();
  };
  
  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header */}
          <div className="flex justify-between items-center h-16">
            {/* Logo and Beta Badge */}
            <div className="flex items-center space-x-3">
              <Link to="/" className="text-white text-xl font-bold hover:text-gray-200 transition-colors flex items-center space-x-2" onClick={closeMobileMenu}>
                <span className="text-2xl">📝</span>
                <span className="hidden sm:block">To-Do App</span>
              </Link>
              <div className="flex items-center space-x-2">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse shadow-md">
                  ✨ BETA
                </span>
                <span className="text-white text-xs opacity-75 hidden sm:block font-medium">v2.0-beta</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user && (
                <>
                  <NotificationBell
                    notifications={notifications}
                    setNotifications={setNotifications}
                    user={user}
                  />
                  <Link
                    to="/shared-groups"
                    className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 ${
                      location.pathname.startsWith('/shared-group') 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-lg'
                    }`}
                  >
                    🤝 Shared Groups
                  </Link>
                  <button
                    onClick={onGroupTaskClick}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-lg"
                  >
                    👥 Group Tasks
                  </button>
                  <span className="text-white hidden lg:block text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    👋 Welcome, {user.name}!
                  </span>
                  <button
                    onClick={onProfileClick}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-lg"
                  >
                    👤 Profile
                  </button>
                  <button
                    onClick={onLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    🚪 Logout
                  </button>
                </>
              )}
              
              {isGuestMode && !user && (
                <>
                  <button
                    onClick={onGroupTaskClick}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-lg"
                  >
                    👥 Group Tasks
                  </button>
                  <span className="text-white hidden lg:block text-sm bg-yellow-500/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    🔓 Guest Mode
                  </span>
                  <button
                    onClick={handleExitGuestClick}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    🚪 Exit Guest
                  </button>
                </>
              )}
              
              {!user && !isGuestMode && (
                <>
                  <button
                    onClick={onLoginClick}
                    className="bg-white text-indigo-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-lg"
                  >
                    🔐 Login
                  </button>
                  <button
                    onClick={onSignupClick}
                    className="bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-lg"
                  >
                    ✨ Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              {/* Mobile Notification Bell */}
              {user && (
                <NotificationBell
                  notifications={notifications}
                  setNotifications={setNotifications}
                  user={user}
                />
              )}
              <button
                onClick={toggleMobileMenu}
                className="hamburger-btn text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <svg className="h-6 w-6 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Always visible below navbar on mobile */}
        <div className="md:hidden border-t border-white/20 bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <SearchBar user={user} isGuestMode={isGuestMode} />
          </div>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:block border-t border-white/20 bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <SearchBar user={user} isGuestMode={isGuestMode} />
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
          <div 
            className={`mobile-menu fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-indigo-600 via-purple-600 to-cyan-500 shadow-2xl transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <span className="text-white text-xl font-bold">📝 Menu</span>
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  BETA
                </span>
              </div>
              <button
                onClick={closeMobileMenu}
                className="text-white hover:text-gray-200 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Content */}
            <div className="p-6 space-y-4 overflow-y-auto h-full pb-32">
              {user && (
                <>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
                    <span className="text-white text-sm font-medium block mb-2">
                      👋 Welcome back!
                    </span>
                    <span className="text-white/90 text-lg font-bold">
                      {user.name}
                    </span>
                  </div>
                  
                  <Link
                    to="/"
                    className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                    onClick={closeMobileMenu}
                  >
                    <span className="text-xl">📋</span>
                    <span className="font-medium">My Tasks</span>
                  </Link>
                  
                  <Link
                    to="/shared-groups"
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                      location.pathname.startsWith('/shared-group')
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <span className="text-xl">🤝</span>
                    <span className="font-medium">Shared Groups</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      onGroupTaskClick();
                      closeMobileMenu();
                    }}
                    className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105"
                  >
                    <span className="text-xl">👥</span>
                    <span className="font-medium">Group Tasks</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onProfileClick && onProfileClick();
                      closeMobileMenu();
                    }}
                    className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105"
                  >
                    <span className="text-xl">👤</span>
                    <span className="font-medium">My Profile</span>
                  </button>
                  
                  <div className="border-t border-white/20 pt-4 mt-6">
                    <button
                      onClick={() => {
                        onLogout();
                        closeMobileMenu();
                      }}
                      className="flex items-center space-x-3 text-white hover:bg-red-500/20 p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105"
                    >
                      <span className="text-xl">🚪</span>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </>
              )}
              
              {isGuestMode && !user && (
                <>
                  <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 mb-6">
                    <span className="text-white text-sm font-medium block mb-2">
                      🔓 Current Mode
                    </span>
                    <span className="text-yellow-200 text-lg font-bold">
                      Guest Mode
                    </span>
                  </div>
                  
                  <Link
                    to="/"
                    className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                    onClick={closeMobileMenu}
                  >
                    <span className="text-xl">📋</span>
                    <span className="font-medium">My Tasks</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      onGroupTaskClick();
                      closeMobileMenu();
                    }}
                    className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105"
                  >
                    <span className="text-xl">👥</span>
                    <span className="font-medium">Group Tasks</span>
                  </button>
                  
                  <div className="border-t border-white/20 pt-4 mt-6">
                    <button
                      onClick={() => {
                        handleExitGuestClick();
                        closeMobileMenu();
                      }}
                      className="flex items-center space-x-3 text-white hover:bg-amber-500/20 p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105"
                    >
                      <span className="text-xl">🚪</span>
                      <span className="font-medium">Exit Guest Mode</span>
                    </button>
                  </div>
                </>
              )}
              
              {!user && !isGuestMode && (
                <>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 text-center">
                    <span className="text-white text-lg font-bold block">
                      Welcome to To-Do App! ✨
                    </span>
                    <span className="text-white/80 text-sm">
                      Please sign in to continue
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      onLoginClick();
                      closeMobileMenu();
                    }}
                    className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105"
                  >
                    <span className="text-xl">🔐</span>
                    <span className="font-medium">Login</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onSignupClick();
                      closeMobileMenu();
                    }}
                    className="flex items-center space-x-3 bg-indigo-800 hover:bg-indigo-900 text-white p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105 shadow-lg"
                  >
                    <span className="text-xl">✨</span>
                    <span className="font-medium">Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showExitConfirm}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        message={
          <>
            Exiting Guest Mode will permanently delete all your guest data, including tasks and groups.
            <br /><br />
            <span className="font-medium">Want to save your data?</span> Consider signing up or logging in to save your tasks permanently.
            <br /><br />
            Are you sure you want to exit Guest Mode and delete all data?
          </>
        }
      />
    </>
  );
};

export default Navbar;
          