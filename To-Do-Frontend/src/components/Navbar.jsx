import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';
import SearchBar from './SearchBar'; // Import the SearchBar component

const Navbar = ({ user, onLoginClick, onSignupClick, onLogout, onGroupTaskClick, isGuestMode, notifications, setNotifications }) => {
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