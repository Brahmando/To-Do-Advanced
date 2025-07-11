
import React, { useState } from 'react';
import { handleJoinRequest, getNotifications } from '../services/sharedGroupService';

const NotificationBell = ({ notifications, setNotifications, user }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationAction = async (groupId, requestId, action) => {
    try {
      await handleJoinRequest(groupId, requestId, action);
      
      // Refresh notifications
      const updatedNotifications = await getNotifications();
      setNotifications(updatedNotifications);
      
      alert(`Request ${action}d successfully!`);
    } catch (error) {
      console.error('Error handling notification:', error);
      alert('Failed to handle request.');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Join Requests</h3>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No pending requests
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div key={notification.requestId} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {notification.userName}
                      </p>
                      <p className="text-sm text-gray-600">
                        wants to join "{notification.groupName}"
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        as {notification.requestedRole}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          "{notification.message}"
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleNotificationAction(
                        notification.groupId, 
                        notification.requestId, 
                        'approve'
                      )}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleNotificationAction(
                        notification.groupId, 
                        notification.requestId, 
                        'reject'
                      )}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => setShowNotifications(false)}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
