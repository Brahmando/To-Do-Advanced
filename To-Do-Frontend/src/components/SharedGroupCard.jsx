
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { joinSharedGroup } from '../services/sharedGroupService';

const SharedGroupCard = ({ group, userRole, isPublic = false, onRefresh }) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('observer');

  const handleJoinPublicGroup = async () => {
    try {
      await joinSharedGroup(group._id, { role: selectedRole });
      onRefresh();
      setShowJoinModal(false);
      alert('Successfully joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group.');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getRoleColor = (role) => {
    const colors = {
      owner: 'bg-red-100 text-red-800',
      collaborator: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      observer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const activeTasks = group.tasks ? group.tasks.filter(task => !task.deleted && !task.completed) : [];
  const completedTasks = group.tasks ? group.tasks.filter(task => task.completed && !task.deleted) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-gray-600 mt-1">{group.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {group.isPublic ? (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Public
            </span>
          ) : (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Private
            </span>
          )}
          {userRole !== 'none' && (
            <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(userRole)}`}>
              {userRole}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Owner:</span>
          <span>{group.ownerName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Members:</span>
          <span>{group.members ? group.members.length : 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Active Tasks:</span>
          <span>{activeTasks.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Completed:</span>
          <span>{completedTasks.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Changes:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {group.totalChanges || 0}
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        Created: {formatDate(group.created)}
      </div>

      <div className="flex space-x-2">
        {userRole === 'none' && isPublic && (
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm"
          >
            Join Group
          </button>
        )}
        {userRole !== 'none' && (
          <Link
            to={`/shared-group/${group._id}`}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm text-center"
          >
            Open Group
          </Link>
        )}
      </div>

      {/* Join Modal for Public Groups */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Join {group.name}</h3>
            
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Role:
              </label>
              <div className="space-y-2">
                {['observer', 'medium', 'collaborator'].map(role => (
                  <label key={role} className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={selectedRole === role}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="mr-2"
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinPublicGroup}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedGroupCard;
