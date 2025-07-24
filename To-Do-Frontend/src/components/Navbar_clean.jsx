import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';

const ConfirmationDialog = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Warning</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Exit Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ user, onLoginClick, onSignupClick, onLogout, onGroupTaskClick, isGuestMode, notifications, setNotifications }) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-lg mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop & Mobile Header */}
        <div className="flex justify-between items-center h-16">
          {/* Logo and Beta Badge */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="text-white text-xl font-bold hover:text-gray-200" onClick={closeMobileMenu}>
              To-Do App
            </Link>
            <div className="flex items-center space-x-2">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                BETA
              </span>
              <span className="text-white text-xs opacity-75 hidden sm:block">v1.0-beta</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <NotificationBell 
                  notifications={notifications} 
                  setNotifications={setNotifications}
                />
                <Link 
                  to="/" 
                  className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Tasks
                </Link>
                <Link 
                  to="/shared-groups" 
                  className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Shared Groups
                </Link>
                <button 
                  onClick={onGroupTaskClick}
                  className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Groups
                </button>
                <SearchBar />
                <span className="text-white text-sm">
                  Welcome, {user.name}!
                </span>
                <button 
                  onClick={onLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            )}
            
            {isGuestMode && (
              <>
                <Link 
                  to="/" 
                  className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Tasks
                </Link>
                <button 
                  onClick={onGroupTaskClick}
                  className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Groups
                </button>
                <SearchBar />
                <span className="text-yellow-200 text-sm font-medium">
                  Guest Mode
                </span>
                <button 
                  onClick={handleExitGuestClick}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Exit Guest
                </button>
              </>
            )}
            
            {!user && !isGuestMode && (
              <>
                <button 
                  onClick={onLoginClick}
                  className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={onSignupClick}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-gray-200 p-2 rounded-md"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-indigo-700 rounded-lg mt-2">
              {user && (
                <>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-white text-sm font-medium">
                      Welcome, {user.name}!
                    </span>
                    <NotificationBell 
                      notifications={notifications} 
                      setNotifications={setNotifications}
                    />
                  </div>
                  <Link 
                    to="/" 
                    onClick={closeMobileMenu}
                    className="text-white hover:bg-indigo-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Tasks
                  </Link>
                  <Link 
                    to="/shared-groups" 
                    onClick={closeMobileMenu}
                    className="text-white hover:bg-indigo-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Shared Groups
                  </Link>
                  <button 
                    onClick={() => {
                      onGroupTaskClick();
                      closeMobileMenu();
                    }}
                    className="text-white hover:bg-indigo-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    My Groups
                  </button>
                  <div className="px-3 py-2">
                    <SearchBar />
                  </div>
                  <button 
                    onClick={() => {
                      onLogout();
                      closeMobileMenu();
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </>
              )}
              
              {isGuestMode && (
                <>
                  <div className="px-3 py-2">
                    <span className="text-yellow-200 text-sm font-medium">
                      Guest Mode
                    </span>
                  </div>
                  <Link 
                    to="/" 
                    onClick={closeMobileMenu}
                    className="text-white hover:bg-indigo-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Tasks
                  </Link>
                  <button 
                    onClick={() => {
                      onGroupTaskClick();
                      closeMobileMenu();
                    }}
                    className="text-white hover:bg-indigo-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    My Groups
                  </button>
                  <div className="px-3 py-2">
                    <SearchBar />
                  </div>
                  <button 
                    onClick={() => {
                      handleExitGuestClick();
                      closeMobileMenu();
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    Exit Guest
                  </button>
                </>
              )}
              
              {!user && !isGuestMode && (
                <>
                  <button 
                    onClick={() => {
                      onLoginClick();
                      closeMobileMenu();
                    }}
                    className="text-white hover:bg-indigo-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => {
                      onSignupClick();
                      closeMobileMenu();
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
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
    </nav>
  );
};

export default Navbar;
