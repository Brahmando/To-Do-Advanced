import React, { useState } from 'react';

const GroupTaskList = ({ groups, handleCompleteTask, handleDeleteTask, formatDate, onCompleteGroup, onDeleteGroup }) => {
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

  if (groups.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-purple-600 mb-4 flex justify-between items-center">
        Group Tasks ({groups.length})
        {groups.length > 0 && (
          <button 
            onClick={() => setExpandedGroups(prev => ({ ...prev, toggleAll: !prev.toggleAll }))}
            className="text-gray-500"
          >
            {expandedGroups.toggleAll ? '▼' : '▲'}
          </button>
        )}
      </h2>
      <div className={`space-y-4 ${expandedGroups.toggleAll ? 'max-h-80 overflow-y-auto' : 'hidden'}`}>
        {groups.map(group => (
          <div key={group._id} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleGroupExpansion(group._id)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  {expandedGroups[group._id] ? '▼' : '▶'}
                </button>
                <h3 className="text-lg font-semibold text-purple-800">{group.name}</h3>
                <span className="text-sm text-purple-600">
                  ({group.tasks.filter(t => !t.deleted).length} tasks)
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
                    canCompleteGroup(group) && !group.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  Complete
                </button>
              </div>
            </div>
            {expandedGroups[group._id] && (
              <div className="ml-6 max-h-60 overflow-y-auto overflow-x-hidden">
                {group.tasks.filter(t => !t.deleted).length === 0 ? (
                  <div className="text-purple-600 text-sm">No tasks in this group</div>
                ) : (
                  <div className="space-y-2">
                    {group.tasks.filter(t => !t.deleted).map(task => (
                      <div key={task._id} className={`p-3 rounded border-l-4 ${task.completed ? 'bg-green-50 border-green-400' : 'bg-white border-purple-400'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <div className={`font-medium ${task.completed ? 'text-green-700' : 'text-gray-800'}`}>
                              {task.text}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {formatDate(task.date)}
                              {task.completed && task.completedAt && (
                                <span> | Completed: {formatDate(task.completedAt)}</span>
                              )}
                            </div>
                          </div>
                          {!task.completed && (
                            <div className="flex gap-2 mt-2 md:mt-0">
                              <button 
                                onClick={() => handleCompleteTask(task._id)} 
                                className="px-3 py-1 text-sm font-semibold rounded-lg bg-gradient-to-r from-green-400 to-emerald-600 text-white"
                              >
                                Complete
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(task._id, 'group')} 
                                className="px-3 py-1 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-400 to-rose-600 text-white"
                              >
                                Delete
                              </button>
                            </div>
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
    </div>
  );
};

export default GroupTaskList;