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
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-lg mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white text-xl font-bold hover:text-gray-200">
              To-Do App
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <Link
                to="/shared-groups"
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  location.pathname.startsWith('/shared-group') 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                Shared Groups
              </Link>
            )}
            {(user || isGuestMode) && (
              <button
                onClick={onGroupTaskClick}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Group Tasks
              </button>
            )}
            {user && (
              <NotificationBell 
                notifications={notifications} 
                setNotifications={setNotifications}
                user={user}
              />
            )}
            {user ? (
              <>
                <span className="text-white">Welcome, {user.name}!</span>
                <button
                  onClick={onLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : isGuestMode ? (
              <>
                <span className="text-white">Guest Mode</span>
                <button
                  onClick={handleExitGuestClick}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Exit Guest Mode
                </button>
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
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="bg-white text-indigo-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition font-medium"
                >
                  Login
                </button>
                <button
                  onClick={onSignupClick}
                  className="bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-2 rounded-lg transition font-medium"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
        {/* Search Bar Row */}
        {user && (
          <div className="pb-4">
            <SearchBar user={user} isGuestMode={isGuestMode} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;