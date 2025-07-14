
import React from 'react';
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import CompletedList from './CompletedList';
import DeletedList from './DeletedList';
import GroupTaskList from './GroupTaskList';

const HomePage = ({
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
  isGuestMode
}) => {
  return (
    <div className="flex flex-col items-center py-10 px-2">
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
