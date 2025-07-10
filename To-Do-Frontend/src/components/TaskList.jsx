import React, { useState, useEffect } from 'react';

const TaskList = ({ tasks, handleComplete, handleDelete, formatDate }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (tasks.length > 0) {
      setIsOpen(true);
    }
  }, [tasks]);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-primary mb-4 flex justify-between items-center">
        Active Tasks ({tasks.length})
        <button onClick={toggleDropdown} className="text-gray-500">
          {isOpen ? '▼' : '▲'}
        </button>
      </h2>
      {isOpen && (
        <div className="max-h-60 overflow-y-auto overflow-x-hidden">
          {tasks.length === 0 && <div className="text-gray-400 text-center mb-4">No active tasks</div>}
          <ul className="space-y-4">
            {tasks.map(task => (
              <li key={task._id} className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-lg shadow p-4 border-l-4 border-primary/60 hover:scale-[1.01] transition">
                <div>
                  <div className="font-medium text-lg text-gray-800">{task.text}</div>
                  <div className="text-xs text-gray-500 mt-1">Due: {formatDate(task.date)} | Added: {formatDate(task.created)}</div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button onClick={() => handleComplete(task._id)} className="mx-1 px-5 py-2 text-base font-semibold rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow border-none focus:outline-none focus:ring-2 focus:ring-green-200">Complete</button>
                  <button onClick={() => handleDelete(task._id, 'tasks')} className="mx-1 px-5 py-2 text-base font-semibold rounded-xl bg-gradient-to-r from-red-400 to-rose-600 text-white shadow border-none focus:outline-none focus:ring-2 focus:ring-red-200">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskList;