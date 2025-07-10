
import React from 'react';

const Navbar = ({ user, onLoginClick, onSignupClick, onLogout, onGroupTaskClick, isGuestMode }) => {
  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-lg mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-white text-xl font-bold">To-Do App</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {(user || isGuestMode) && (
              <button
                onClick={onGroupTaskClick}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Group Tasks
              </button>
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
      </div>
    </nav>
  );
};

export default Navbar;
