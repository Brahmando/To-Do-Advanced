import React from 'react';

const DeletedList = ({ deleted, formatDate }) => (
  <div className="mt-10">
    <h2 className="text-xl font-semibold text-deleted mb-2">Recently Deleted (last 3)</h2>
    {deleted.length === 0 && <div className="text-gray-300 text-center mb-2">No deleted tasks</div>}
    <ul className="space-y-2">
      {deleted.map(task => (
        <li key={task._id} className="flex flex-col md:flex-row md:items-center justify-between bg-deleted/10 rounded-lg p-3 text-deleted border border-rose-200 shadow-md">
          <div>
            <div className="font-medium text-lg">{task.text}</div>
            <div className="text-xs mt-1">Deleted: {formatDate(task.deletedAt)}</div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default DeletedList;
