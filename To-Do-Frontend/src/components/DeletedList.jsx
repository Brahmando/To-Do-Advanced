import React, { useState, useEffect } from 'react';

const DeletedList = ({ deleted, formatDate }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Ensure that the dropdown starts closed
    setIsOpen(false); 
  }, []);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold text-deleted mb-4 flex justify-between items-center" onClick={toggleDropdown}>
        Recently Deleted ({deleted.length})
        <button className="text-gray-500">
          {isOpen ? '▼' : '▲'}
        </button>
      </h2>
      {isOpen && (
        <ul className="space-y-2 max-h-60 overflow-y-auto overflow-x-hidden">
          {deleted.length === 0 && <div className="text-gray-300 text-center">No deleted tasks</div>}
          {deleted.map(task => (
            <li key={task._id} className="flex flex-col md:flex-row md:items-center justify-between bg-deleted/10 rounded-lg p-3 text-deleted border border-rose-200 shadow-md">
              <div>
                <div className="font-medium text-lg">{task.text}</div>
                <div className="text-xs mt-1">Deleted: {formatDate(task.deletedAt)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DeletedList;