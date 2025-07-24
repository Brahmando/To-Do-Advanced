import React, { useEffect } from 'react';
import GroupTaskList from './GroupTaskList';
import ProgressBar from './ProgressBar';
import TaskInput from './TaskInput';

const GroupTasksPage = ({
  groups,
  input,
  setInput,
  date,
  setDate,
  handleAdd,
  handleCompleteGroupTask,
  handleDeleteGroupTask,
  handleUndoGroupTask,
  handleEditGroupTask,
  handleCompleteGroup,
  handleDeleteGroup,
  formatDate,
  isGuestMode,
  isGroupTaskMode,
  setIsGroupTaskMode,
  groupName,
  setGroupName
}) => {
  // Calculate overall group task statistics
  const totalGroups = groups.length;
  const completedGroups = groups.filter(group => group.completed).length;
  const activeGroups = totalGroups - completedGroups;

  // Calculate overall task statistics across all groups
  const allTasks = groups.reduce((acc, group) => {
    const groupTasks = group.tasks?.filter(task => !task.deleted) || [];
    return acc.concat(groupTasks);
  }, []);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(task => task.completed).length;
  const activeTasks = totalTasks - completedTasks;

  // Automatically enable group task mode when on group tasks page
  useEffect(() => {
    setIsGroupTaskMode(true);
  }, [setIsGroupTaskMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
            Group Tasks
          </h1>
          <p className="text-gray-600">
            Manage your collaborative group tasks efficiently
            {isGuestMode && <span className="text-orange-500 ml-2">(Guest Mode)</span>}
          </p>
        </div>

        {/* Overall Progress Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span> Overall Progress
          </h2>
          
          {/* Tasks Progress */}
          {totalTasks > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Task Completion</h3>
              <ProgressBar 
                completed={completedTasks} 
                total={totalTasks} 
                height="h-4" 
                showPercentage={true} 
              />
            </div>
          )}

          {/* Groups Progress */}
          {totalGroups > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Group Completion</h3>
              <ProgressBar 
                completed={completedGroups} 
                total={totalGroups} 
                height="h-4" 
                showPercentage={true} 
              />
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{activeGroups}</div>
              <div className="text-sm text-gray-600">Active Groups</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedGroups}</div>
              <div className="text-sm text-gray-600">Completed Groups</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activeTasks}</div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{completedTasks}</div>
              <div className="text-sm text-gray-600">Completed Tasks</div>
            </div>
          </div>
        </div>

        {/* Add Group Task Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">➕</span> Add New Group Task
          </h2>
          <TaskInput 
            input={input} 
            setInput={setInput} 
            date={date} 
            setDate={setDate} 
            handleAdd={handleAdd}
            isGroupTaskMode={isGroupTaskMode}
            setIsGroupTaskMode={setIsGroupTaskMode}
            groupName={groupName}
            setGroupName={setGroupName}
            hideGroupToggle={true}
          />
        </div>

        {/* Group Tasks List Section */}
        <div className="space-y-6">
          {groups.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <GroupTaskList 
                groups={groups}
                handleCompleteTask={handleCompleteGroupTask}
                handleDeleteTask={handleDeleteGroupTask}
                handleUndoTask={handleUndoGroupTask}
                handleEditTask={handleEditGroupTask}
                formatDate={formatDate}
                onCompleteGroup={handleCompleteGroup}
                onDeleteGroup={handleDeleteGroup}
                showShareButton={false}
                showMainDropdown={false}
              />
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No group tasks yet!
              </h3>
              <p className="text-gray-500 mb-4">
                Start by creating your first group task above.
              </p>
              <div className="text-sm text-gray-400">
                Group tasks help you collaborate and organize work with your team.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupTasksPage;
