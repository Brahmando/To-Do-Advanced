import React from 'react';

const CompletedList = ({ completed, handleDelete, handleUndo, formatDate }) => (
  <div className="mt-8">
    <h2 className="text-2xl font-semibold text-green-600 mb-4">Completed Tasks ({completed.length})</h2>
    <div className="max-h-80 overflow-y-auto">
      <ul className="space-y-4">
        {completed.map(task => (
          <li key={task._id} className="flex flex-col md:flex-row md:items-center justify-between bg-green-50/50 rounded-lg p-3 text-green-700 border border-green-200 shadow-md">
            <div>
              <div className="font-medium text-lg">{task.text}</div>
              <div className="text-xs mt-1">Completed: {formatDate(task.completedAt)}</div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleUndo(task._id)} 
                className="px-5 py-2 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow border-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Undo
              </button>
              <button 
                onClick={() => handleDelete(task._id, 'completed')} 
                className="px-5 py-2 text-base font-semibold rounded-xl bg-gradient-to-r from-red-400 to-rose-600 text-white shadow border-none focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default CompletedList;