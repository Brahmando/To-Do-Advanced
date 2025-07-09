
import React, { useState, useEffect } from 'react';

const GroupTaskModal = ({ isOpen, onClose, groups, formatDate, onCompleteGroup, onDeleteGroup }) => {
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const canCompleteGroup = (group) => {
    return group.tasks.length > 0 && group.tasks.every(task => task.completed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Group Tasks</h2>
        
        {groups.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No group tasks created yet
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleGroupExpansion(group._id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedGroups[group._id] ? '▼' : '▶'}
                    </button>
                    <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    <span className="text-sm text-gray-500">
                      ({group.tasks.length} tasks)
                    </span>
                    {group.completed && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onCompleteGroup(group._id)}
                      disabled={!canCompleteGroup(group) || group.completed}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        canCompleteGroup(group) && !group.completed
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => onDeleteGroup(group._id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedGroups[group._id] && (
                  <div className="mt-4 ml-6 max-h-40 overflow-y-auto">
                    {group.tasks.length === 0 ? (
                      <div className="text-gray-500 text-sm">No tasks in this group</div>
                    ) : (
                      <div className="space-y-2">
                        {group.tasks.map(task => (
                          <div key={task._id} className={`p-2 rounded border-l-4 ${
                            task.completed 
                              ? 'bg-green-50 border-green-400 text-green-700' 
                              : 'bg-gray-50 border-gray-400'
                          }`}>
                            <div className="font-medium">{task.text}</div>
                            <div className="text-xs text-gray-500">
                              Due: {formatDate(task.date)}
                              {task.completed && task.completedAt && (
                                <span> | Completed: {formatDate(task.completedAt)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default GroupTaskModal;
