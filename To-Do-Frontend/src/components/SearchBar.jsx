
import React, { useState, useEffect } from 'react';
import { getTasks } from '../services/taskService';
import { getGroups } from '../services/groupService';
import { getSharedGroups } from '../services/sharedGroupService';

const SearchBar = ({ user, isGuestMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() && user) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, filter, user]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const searchResults = [];

      if (filter === 'All' || filter === 'Tasks') {
        // Search normal tasks
        const tasks = await getTasks();
        const matchingTasks = tasks.filter(task => 
          task.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
        searchResults.push(...matchingTasks.map(task => ({
          ...task,
          type: 'task',
          source: 'Personal Tasks',
          status: task.completed ? 'Completed' : task.deleted ? 'Deleted' : 'Active'
        })));

        // Search group tasks
        const groups = await getGroups();
        groups.forEach(group => {
          if (group.tasks) {
            const matchingGroupTasks = group.tasks.filter(task =>
              task.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
            searchResults.push(...matchingGroupTasks.map(task => ({
              ...task,
              type: 'task',
              source: `Group Task (${group.name})`,
              status: task.completed ? 'Completed' : task.deleted ? 'Deleted' : 'Active'
            })));
          }
        });

        // Search shared group tasks
        const sharedGroups = await getSharedGroups();
        sharedGroups.forEach(group => {
          if (group.tasks) {
            const matchingSharedTasks = group.tasks.filter(task =>
              task.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
            searchResults.push(...matchingSharedTasks.map(task => ({
              ...task,
              type: 'task',
              source: `Shared Group (${group.name})`,
              status: task.completed ? 'Completed' : task.deleted ? 'Deleted' : 'Active'
            })));
          }
        });
      }

      if (filter === 'All' || filter === 'Groups') {
        // Search groups
        const groups = await getGroups();
        const matchingGroups = groups.filter(group =>
          group.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        searchResults.push(...matchingGroups.map(group => ({
          ...group,
          type: 'group',
          source: 'Group Tasks',
          status: group.completed ? 'Completed' : 'Active'
        })));

        // Search shared groups
        const sharedGroups = await getSharedGroups();
        const matchingSharedGroups = sharedGroups.filter(group =>
          group.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        searchResults.push(...matchingSharedGroups.map(group => ({
          ...group,
          type: 'group',
          source: 'Shared Groups',
          status: group.completed ? 'Completed' : 'Active'
        })));
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search tasks and groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {loading && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All</option>
          <option value="Groups">Groups</option>
          <option value="Tasks">Tasks</option>
        </select>
      </div>

      {searchQuery.trim() && results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h4 className="font-medium text-gray-700">Search Results ({results.length})</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div key={`${result.type}-${result._id}-${index}`} className="p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {result.type === 'task' ? result.text : result.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {result.source}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        result.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        result.status === 'Deleted' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        result.type === 'task' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {result.type === 'task' ? 'Task' : 'Group'}
                      </span>
                    </div>
                    {result.type === 'task' && result.date && (
                      <p className="text-xs text-gray-500 mt-1">Due: {formatDate(result.date)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery.trim() && results.length === 0 && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No results found for "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;
