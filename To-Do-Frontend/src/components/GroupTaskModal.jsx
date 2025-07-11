
import React, { useState } from 'react';
import { createSharedGroup } from '../services/sharedGroupService';

const GroupTaskModal = ({ isOpen, onClose, groups, formatDate, onCompleteGroup, onDeleteGroup }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [shareData, setShareData] = useState({
    isPublic: false,
    accessKey: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleShareGroup = async () => {
    if (!selectedGroup) return;
    
    if (!shareData.isPublic && !shareData.accessKey.trim()) {
      alert('Please provide an access key for private groups.');
      return;
    }

    try {
      await createSharedGroup({
        name: selectedGroup.name,
        description: shareData.description,
        isPublic: shareData.isPublic,
        accessKey: shareData.isPublic ? undefined : shareData.accessKey
      });
      
      setShowShareModal(false);
      setSelectedGroup(null);
      setShareData({ isPublic: false, accessKey: '', description: '' });
      alert('Group converted to shared group successfully!');
    } catch (error) {
      console.error('Error sharing group:', error);
      alert('Failed to share group. Group name might already exist.');
    }
  };

  const openShareModal = (group) => {
    setSelectedGroup(group);
    setShareData({
      isPublic: false,
      accessKey: '',
      description: group.name + ' - shared group'
    });
    setShowShareModal(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Group Tasks</h1>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No group tasks yet. Create your first group task!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map(group => {
                const activeTasks = group.tasks?.filter(task => !task.completed && !task.deleted) || [];
                const completedTasks = group.tasks?.filter(task => task.completed && !task.deleted) || [];
                const allCompleted = activeTasks.length === 0 && completedTasks.length > 0;

                return (
                  <div key={group._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-800">{group.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openShareModal(group)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Share
                        </button>
                        {allCompleted && !group.completed && (
                          <button
                            onClick={() => onCompleteGroup(group._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Complete Group
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteGroup(group._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active Tasks:</span>
                        <span>{activeTasks.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completed:</span>
                        <span>{completedTasks.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Created:</span>
                        <span>{formatDate(group.created)}</span>
                      </div>
                    </div>

                    {group.completed && (
                      <div className="bg-green-100 text-green-800 p-2 rounded text-sm text-center font-medium">
                        ✓ Group Completed
                      </div>
                    )}

                    <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                      {activeTasks.map(task => (
                        <div key={task._id} className="bg-white p-2 rounded border">
                          <p className="text-sm font-medium">{task.text}</p>
                          <p className="text-xs text-gray-500">Due: {formatDate(task.date)}</p>
                        </div>
                      ))}
                      {completedTasks.map(task => (
                        <div key={task._id} className="bg-green-50 p-2 rounded border border-green-200">
                          <p className="text-sm font-medium text-green-800 line-through">{task.text}</p>
                          <p className="text-xs text-green-600">Completed: {formatDate(task.completedAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Share Group Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Share "{selectedGroup?.name}"
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={shareData.description}
                    onChange={(e) => setShareData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Describe this shared group"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shareData.isPublic}
                      onChange={(e) => setShareData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Make this group public
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Public groups can be discovered and joined by anyone
                  </p>
                </div>

                {!shareData.isPublic && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Key *
                    </label>
                    <input
                      type="text"
                      value={shareData.accessKey}
                      onChange={(e) => setShareData(prev => ({ ...prev, accessKey: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter access key for private group"
                      required
                    />
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setSelectedGroup(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShareGroup}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                  >
                    Share Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupTaskModal;
