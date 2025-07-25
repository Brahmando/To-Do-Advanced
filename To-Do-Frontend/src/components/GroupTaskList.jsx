import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';


const GroupTaskList = ({ 
  groups, 
  handleCompleteTask, 
  handleDeleteTask, 
  formatDate, 
  onCompleteGroup, 
  onDeleteGroup,
  handleUndoTask,
  handleEditTask,
  showShareButton = false,
  onShareGroup,
  showMainDropdown = true
}) => {
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskData, setEditTaskData] = useState({ text: '', date: '' });
  const [groupVisibility, setGroupVisibility] = useState({});
  const [groupSectionView, setGroupSectionView] = useState(false);

    useEffect(() => {
      // If showMainDropdown is false, always show the content (set to true)
      // If showMainDropdown is true, start with dropdown closed (set to false)
      setGroupSectionView(!showMainDropdown); 
    }, [showMainDropdown]);

    const toggleGroupSectionView = () => {
      setGroupSectionView(prev => !prev);
    };                            

  useEffect(() => {
    // Set visibility for new groups without overriding existing state
    setGroupVisibility(prev => {
      console.log('Previous visibility state:', prev);
      const newVisibility = { ...prev };
      groups.forEach(group => {
        if (newVisibility[group._id] === undefined) {
          newVisibility[group._id] = false; // Default new groups to visible
          console.log('New visibility state:', newVisibility);
        }
      });
      return newVisibility;
    });
  }, [groups]);

  const toggleGroupVisibility = (groupId) => {
    setGroupVisibility(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const startEditTask = (task) => {
    setEditingTask(task._id);
    setEditTaskData({
      text: task.text,
      // Format date for datetime-local input
      date: task.date.slice(0, 16)
    });
  };

  const saveEditTask = (taskId) => {
    if (!editTaskData.text.trim() || !editTaskData.date) {
      alert('Please fill in all fields.');
      return;
    }
    handleEditTask(taskId, editTaskData.text, editTaskData.date);
    setEditingTask(null);
    setEditTaskData({ text: '', date: '' });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTaskData({ text: '', date: '' });
  };

  return (
    <div className="mt-8">
      <h2 
        className={`text-2xl font-semibold text-purple-600 mb-4 flex justify-between items-center ${showMainDropdown ? 'cursor-pointer' : ''}`} 
        onClick={showMainDropdown ? toggleGroupSectionView : undefined}
      >
        Group Tasks ({groups.length})
        {showMainDropdown && (
          <button className="text-gray-500">
            {groupSectionView ? '▼' : '▲'}
          </button>
        )}
      </h2>
      {(showMainDropdown ? groupSectionView : true) && <div className="max-h-80 overflow-y-auto overflow-x-hidden">
        {groups.length === 0 && <div className="text-gray-400 text-center mb-4">No group tasks</div>}
        <div className="space-y-4">
          {groups.map(group => {
            const activeTasks = group.tasks?.filter(task => !task.completed && !task.deleted) || [];
            const completedTasks = group.tasks?.filter(task => task.completed && !task.deleted) || [];
            const allCompleted = activeTasks.length === 0 && completedTasks.length > 0;
            const isVisible = groupVisibility[group._id];

            return (
              <div key={group._id} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleGroupVisibility(group._id)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {isVisible ? '▼' : '▲'}
                    </button>
                    <h3 className="text-lg font-semibold text-purple-800">{group.name}</h3>
                    <span className="text-sm text-purple-600">
                      ({group.tasks?.filter(t => !t.deleted).length || 0} tasks)
                    </span>
                    {group.completed && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {showShareButton && onShareGroup && (
                      <button
                        onClick={() => onShareGroup(group)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Share
                      </button>
                    )}
                    {allCompleted && !group.completed && (
                      <button
                        onClick={() => {
                          if (window.confirm('Once marked as completed, this action cannot be undone. Are you sure?')) {
                            onCompleteGroup(group._id);
                          }
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Complete Group
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                          onDeleteGroup(group._id);
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete Group
                    </button>
                  </div>
                </div>

                {/* Progress Bar for each group */}
                {(activeTasks.length + completedTasks.length) > 0 && (
                  <div className="mb-3">
                    <ProgressBar
                      completed={completedTasks.length}
                      total={activeTasks.length + completedTasks.length}
                      showPercentage={true}
                      height="h-2"
                    />
                  </div>
                )}

                {isVisible && (
                  <div className="space-y-3">
                    {/* Active Tasks */}
                    {activeTasks.length > 0 && ( 
                      <div>
                        <h4 className="font-medium text-purple-700 mb-2">Active Tasks:</h4>
                        {activeTasks.map(task => (
                          <div key={task._id} className="bg-white p-3 rounded border mb-2">
                            {editingTask === task._id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editTaskData.text}
                                  onChange={(e) => setEditTaskData(prev => ({ ...prev, text: e.target.value }))}
                                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                  type="datetime-local"
                                  value={editTaskData.date}
                                  onChange={(e) => setEditTaskData(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => saveEditTask(task._id)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{task.text}</p>
                                  <p className="text-xs text-gray-500">Due: {formatDate(task.date)}</p>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleCompleteTask(task._id)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => startEditTask(task)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Completed Tasks:</h4>
                        {completedTasks.map(task => (
                          <div key={task._id} className="bg-green-50 p-2 sm:p-3 rounded border border-green-200 mb-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-800 line-through">{task.text}</p>
                                <p className="text-xs text-green-600">Completed: {formatDate(task.completedAt)}</p>
                              </div>
                              <button
                                onClick={() => handleUndoTask(task._id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs"
                              >
                                Undo
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>} 
    </div>
  );
};

export default GroupTaskList;
