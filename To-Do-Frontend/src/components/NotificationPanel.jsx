
import React from 'react';

const NotificationPanel = ({ notifications, onClose, onHandleRequest }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Join Requests</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending join requests
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={`${notification.groupId}-${notification.requestId}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-800">
                        {notification.userName}
                      </span>
                      <span className="text-sm text-gray-600">wants to join</span>
                      <span className="font-medium text-blue-600">
                        {notification.groupName}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Requested Role:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        notification.requestedRole === 'collaborator' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {notification.requestedRole}
                      </span>
                    </div>
                    
                    {notification.message && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Message:</span>
                        <p className="mt-1 text-gray-700">{notification.message}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onHandleRequest(
                        notification.groupId,
                        notification.requestId,
                        'approve'
                      )}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onHandleRequest(
                        notification.groupId,
                        notification.requestId,
                        'reject'
                      )}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
