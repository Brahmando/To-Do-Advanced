import React from 'react';

const ProgressBar = ({ completed, total, showPercentage = true, height = 'h-2', className = '' }) => {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div 
          className={`${height} bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-600">
            {completed} of {total} completed
          </span>
          <span className="text-xs font-semibold text-gray-700">
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
