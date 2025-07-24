import React from 'react';
import { Link } from 'react-router-dom';
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import CompletedList from './CompletedList';
import DeletedList from './DeletedList';
import GroupTaskList from './GroupTaskList';


const HomePage = ({
  user,
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
  isGroupTaskMode,
  setIsGroupTaskMode,
  groupName,
  setGroupName,
  groups,
  handleCompleteGroupTask,
  handleDeleteGroupTask,
  handleCompleteGroup,
  handleDeleteGroup,
  formatDate,
  isGuestMode,
  handleUndoGroupTask,
  handleEditGroupTask
}) => {
  return (
    <div className="flex flex-col items-center py-10 px-2 relative">
      {/* Beta Banner */}
      <div className="w-full max-w-2xl mb-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-3 rounded-lg shadow-lg border border-yellow-300">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">🚀</span>
            <div className="text-center">
              <p className="font-bold text-sm">Welcome to To-Do App Beta!</p>
              <p className="text-xs opacity-90">
                You're testing our latest features. Found a bug? We'd love your feedback!
              </p>
            </div>
            <span className="text-lg">🧪</span>
          </div>
        </div>
      </div>

      {/* Prominent Feedback Section - Positioned to the right */}
      {user && (
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-30 hidden lg:block">
          <Link
            to="/feedback"
            className="group feedback-float relative transition-all duration-300 transform hover:scale-110"
          >
            <div className="flex flex-col items-center space-y-1">
              <div className="text-4xl animate-bounce cursor-pointer bg-gradient-to-br from-orange-400 via-pink-300 to-indigo-400 p-2 rounded-full shadow-md">
                💭
              </div>
              <span className="text-xs font-bold text-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm">
                Share Your<br />Feedback
              </span>
            </div>
            <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-ping">
              !
            </div>
          </Link>
        </div>
      )}

      {/* Mobile Feedback Button */}
      {user && (
        <div className="lg:hidden w-full max-w-2xl mb-4">
          <Link
            to="/feedback"
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white hover:text-gray-900 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            <span className="text-2xl">💭</span>
            <div className="text-center">
              <p className="font-bold text-sm">Share Your Feedback</p>
              <p className="text-xs opacity-90">Help us improve the app!</p>
            </div>
            <span className="text-xl animate-pulse">→</span>
          </Link>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white/80 rounded-3xl shadow-2xl p-8 backdrop-blur-md border border-blue-100">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400 mb-2 text-center drop-shadow-lg">
          Stunning To-Do App
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Organize your day with style ✨
          {isGuestMode && <span className="text-orange-500"> (Guest Mode)</span>}
        </p>

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
        />

        {tasks.length > 0 && (
          <TaskList tasks={tasks} handleComplete={handleComplete} handleDelete={handleDelete} formatDate={formatDate} />
        )}

        {groups.length > 0 && (
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
          />
        )}

        {completed.length > 0 && (
          <CompletedList completed={completed} handleDelete={handleDelete} handleUndo={handleUndo} formatDate={formatDate} />
        )}

        {deleted.length > 0 && (
          <DeletedList deleted={deleted} formatDate={formatDate} />
        )}

        <div className="mt-10 text-center text-gray-400 text-xs">Made by Avengers with ❤</div>
      </div>
    </div>
  );
};

export default HomePage;