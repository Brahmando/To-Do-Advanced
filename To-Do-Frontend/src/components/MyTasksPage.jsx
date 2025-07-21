import React from 'react';
import TaskList from './TaskList';
import CompletedList from './CompletedList';
import DeletedList from './DeletedList';
import ProgressBar from './ProgressBar';
import TaskInput from './TaskInput';

const MyTasksPage = ({
  tasks,
  completed,
  deleted,
  input,
  setInput,
  date,
  setDate,
  handleAdd,
  handleComplete,
  handleDelete,
  handleUndo,
  formatDate,
  isGuestMode
}) => {
  const totalTasks = tasks.length + completed.length;
  const completedCount = completed.length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            My Tasks
          </h1>
          <p className="text-gray-600">
            Manage your personal tasks efficiently
            {isGuestMode && <span className="text-orange-500 ml-2">(Guest Mode)</span>}
          </p>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span> Overall Progress
          </h2>
          <ProgressBar 
            completed={completedCount} 
            total={totalTasks} 
            height="h-4" 
            showPercentage={true} 
          />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completed.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{deleted.length}</div>
              <div className="text-sm text-gray-600">Deleted</div>
            </div>
          </div>
        </div>

        {/* Add Task Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">➕</span> Add New Task
          </h2>
          <TaskInput 
            input={input} 
            setInput={setInput} 
            date={date} 
            setDate={setDate} 
            handleAdd={handleAdd}
            isGroupTaskMode={false}
            setIsGroupTaskMode={() => {}}
            groupName=""
            setGroupName={() => {}}
          />
        </div>

        {/* Tasks Sections */}
        <div className="space-y-6">
          {/* Active Tasks */}
          {tasks.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <TaskList 
                tasks={tasks} 
                handleComplete={handleComplete} 
                handleDelete={handleDelete} 
                formatDate={formatDate} 
              />
            </div>
          )}

          {/* Completed Tasks */}
          {completed.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <CompletedList 
                completed={completed} 
                handleDelete={handleDelete} 
                handleUndo={handleUndo} 
                formatDate={formatDate} 
              />
            </div>
          )}

          {/* Deleted Tasks */}
          {deleted.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <DeletedList 
                deleted={deleted} 
                formatDate={formatDate} 
              />
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && completed.length === 0 && deleted.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tasks yet!
              </h3>
              <p className="text-gray-500">
                Start by adding your first task above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTasksPage;

