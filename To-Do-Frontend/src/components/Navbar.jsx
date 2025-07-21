import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';
import './Navbar.css';

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
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
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
      if (showAccountDropdown && !event.target.closest('.account-dropdown') && !event.target.closest('.account-button')) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, showAccountDropdown]);
  
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
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Main Header */}
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Beta Badge */}
            <div className="flex items-center min-w-0 flex-1">
              <Link to="/" className="text-white font-bold hover:text-gray-200 transition-colors flex items-center min-w-0" onClick={closeMobileMenu}>
                <span className="text-xl sm:text-2xl flex-shrink-0">📝</span>
                <span className="ml-1 sm:ml-2 text-sm sm:text-base md:text-xl truncate">To-Do App</span>
              </Link>
              <div className="flex items-center ml-2 sm:ml-3">
                <span className="bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse shadow-md whitespace-nowrap">
                  ✨ BETA
                </span>
                <span className="text-white text-[10px] sm:text-xs opacity-75 hidden lg:block font-medium ml-1 sm:ml-2">v2.0-beta</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3 xl:space-x-4">
              {user && (
                <Link
                  to="/my-tasks"
                  className={`px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm font-medium transform hover:scale-105 whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white shadow-lg`}
                >
                  <span className="hidden xl:inline">🗒️ </span>My Tasks
                </Link>
              )}
              {user && (
                <>
                  <Link
                    to="/shared-groups"
                    className={`px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm font-medium transform hover:scale-105 whitespace-nowrap ${
                      location.pathname.startsWith('/shared-group') 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-lg'
                    }`}
                  >
                    <span className="hidden xl:inline">🤝 </span>Shared Groups
                  </Link>
                  <Link
                    to="/group-tasks"
                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm font-medium transform hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  >
                    <span className="hidden xl:inline">👥 </span>Group Tasks
                  </Link>
                  
                  {/* Notification Bell with left margin to separate from task buttons */}
                  <div className="ml-4 lg:ml-6">
                    <NotificationBell
                      notifications={notifications}
                      setNotifications={setNotifications}
                      user={user}
                    />
                  </div>
                  
                  {/* Account Dropdown */}
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowAccountDropdown(true)}
                      className="account-button bg-indigo-500 hover:bg-indigo-600 text-white px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm font-medium transform hover:scale-105 hover:shadow-lg whitespace-nowrap flex items-center space-x-1"
                    >
                      <span className="hidden xl:inline">😊</span>
                      <span>Account</span>
                      <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {showAccountDropdown && (
                      <div 
                        className="account-dropdown absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                        onMouseEnter={() => setShowAccountDropdown(true)}
                        onMouseLeave={() => setShowAccountDropdown(false)}
                      >
                        <button
                          onClick={() => {
                            onProfileClick();
                            setShowAccountDropdown(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-base">👤</span>
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            onLogout();
                            setShowAccountDropdown(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-base">🚪</span>
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}              {isGuestMode && !user && (
                <>
                  <Link
                    to="/group-tasks"
                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm font-medium transform hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  >
                    <span className="hidden xl:inline">👥 </span>Group Tasks
                  </Link>
                  <span className="text-white hidden lg:block text-xs bg-yellow-500/30 px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                    🔓 Guest Mode
                  </span>
                  <button
                    onClick={handleExitGuestClick}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm transform hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  >
                    <span className="hidden xl:inline">🚪 </span>Exit Guest
                  </button>
                </>
              )}
              
              {!user && !isGuestMode && (
                <>
                  <button
                    onClick={onLoginClick}
                    className="bg-white text-indigo-600 hover:bg-gray-100 px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm font-medium transform hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  >
                    <span className="hidden lg:inline">🔐 </span>Login
                  </button>
                  <button
                    onClick={onSignupClick}
                    className="bg-indigo-800 hover:bg-indigo-900 text-white px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm font-medium transform hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  >
                    <span className="hidden lg:inline">✨ </span>Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <div className="md:hidden flex items-center space-x-2 sm:space-x-3">
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
                className="hamburger-btn text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
            <SearchBar user={user} isGuestMode={isGuestMode} />
          </div>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:block border-t border-white/20 bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600">
          <div className="w-full px-4 md:px-6 lg:px-8 py-2 md:py-3">
            <SearchBar user={user} isGuestMode={isGuestMode} />
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
          <div 
            className={`mobile-menu fixed left-0 top-0 h-full w-72 sm:w-80 bg-gradient-to-b from-indigo-600 via-purple-600 to-cyan-500 shadow-2xl transform transition-transform duration-300 ease-in-out ${
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
                  
                  {user && (
                    <Link
                      to="/my-tasks"
                      className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                      onClick={closeMobileMenu}
                    >
                      <span className="text-xl">📋</span>
                      <span className="font-medium">My Tasks</span>
                    </Link>
                  )}
                  
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
                  
                  <Link
                    to="/group-tasks"
                    className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105"
                    onClick={closeMobileMenu}
                  >
                    <span className="text-xl">👥</span>
                    <span className="font-medium">Group Tasks</span>
                  </Link>
                  
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
                  
                  {user && (
                    <Link
                      to="/my-tasks"
                      className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                      onClick={closeMobileMenu}
                    >
                      <span className="text-xl">📋</span>
                      <span className="font-medium">My Tasks</span>
                    </Link>
                  )}
                  
                  <Link
                    to="/group-tasks"
                    className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 w-full text-left transform hover:scale-105"
                    onClick={closeMobileMenu}
                  >
                    <span className="text-xl">👥</span>
                    <span className="font-medium">Group Tasks</span>
                  </Link>
                  
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
          