import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getSharedGroups,
  searchPublicGroups,
  createSharedGroup,
  joinSharedGroup,
} from '../services/sharedGroupService';
import ProgressBar from './ProgressBar';
import CreateSharedGroupModal from './CreateSharedGroupModal';
import JoinGroupModal from './JoinGroupModal';
import SharedGroupCard from './SharedGroupCard';

// Floating Action Menu Component
const FloatingActionMenu = ({ onCreateGroup, onJoinGroup, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed right-4 bottom-24 z-50">
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col space-y-3 mb-2">
          {/* Create Group Button */}
          <div className="relative group">
            <button
              onClick={() => {
                onCreateGroup();
                setIsOpen(false);
              }}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Create Group
            </div>
          </div>

          {/* Join Private Group Button */}
          <div className="relative group">
            <button
              onClick={() => {
                onJoinGroup();
                setIsOpen(false);
              }}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </button>
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Join Private Group
            </div>
          </div>

          {/* Refresh Groups Button */}
          <div className="relative group">
            <button
              onClick={() => {
                onRefresh();
                setIsOpen(false);
              }}
              className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Refresh Groups
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="relative group">
            <Link
              to="/"
              className="w-12 h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Back to Home
            </div>
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center transform ${
          isOpen 
            ? 'bg-gray-600 opacity-60 rotate-180' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500 opacity-70 hover:opacity-90'
        }`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-6 w-6 text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
};

const SharedGroupsPage = ({ user }) => {
  const [sharedGroups, setSharedGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-groups');

  useEffect(() => {
    fetchSharedGroups();
    console.log(user)
  }, []);

  const fetchSharedGroups = async () => {
    try {
      const groups = await getSharedGroups();
      console.log(groups)
      setSharedGroups(groups);
    } catch (error) {
      console.error('Error fetching shared groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setPublicGroups([]);
      return;
    }

    try {
      const groups = await searchPublicGroups(query);
      console.log(groups);
      setPublicGroups(groups);
    } catch (error) {
      console.error('Error searching groups:', error);
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      await createSharedGroup(groupData);
      setShowCreateModal(false);
      fetchSharedGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Group name might already exist.');
    }
  };

  const handleJoinGroup = async (joinData) => {
    try {
      // First, find the group by name to get its ID
      const response = await fetch(`https://to-do-advanced-production.up.railway.app/api/shared-groups/find-by-name/${encodeURIComponent(joinData.groupName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Group not found');
      }
      
      const group = await response.json();
      
      // Now join the group using its ID
      await joinSharedGroup(group._id, {
        accessKey: joinData.accessKey,
        role: joinData.role,
        message: joinData.message
      });
      
      setShowJoinModal(false);
      fetchSharedGroups();
      
      if (joinData.role === 'observer') {
        alert('Successfully joined the group!');
      } else {
        alert('Join request sent to group owner for approval!');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert(error.message || 'Failed to join group. Please check your credentials.');
    }
  };

  const getUserRole = (group) => {
    const member = group.members.find(m => m.user === user.id);
    return member ? member.role : 'none';
  };

  const rolePermissions = {
    owner: {
      name: 'Owner',
      permissions: ['Full control', 'Delete group', 'Manage members', 'All task operations'],
      color: 'bg-red-100 text-red-800'
    },
    collaborator: {
      name: 'Collaborator',
      permissions: ['Edit group name', 'Add/edit/delete tasks', 'Reorder tasks', 'View change log'],
      color: 'bg-blue-100 text-blue-800'
    },
    medium: {
      name: 'Medium Access',
      permissions: ['Add tasks', 'Edit own tasks', 'Reorder tasks', 'View change log'],
      color: 'bg-yellow-100 text-yellow-800'
    },
    observer: {
      name: 'Observer',
      permissions: ['View group', 'View tasks', 'View change log'],
      color: 'bg-gray-100 text-gray-800'
    }
  };

  const RoleInfo = ({ role }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const roleInfo = rolePermissions[role];

    return (
      <div className="relative inline-block">
        <div
          className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center cursor-help text-xs"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          i
        </div>
        {showTooltip && (
          <div className="absolute z-10 w-64 p-3 bg-white border border-gray-300 rounded-lg shadow-lg bottom-6 left-0">
            <h4 className="font-semibold text-sm mb-2">{roleInfo.name}</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {roleInfo.permissions.map((permission, index) => (
                <li key={index}>• {permission}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 sm:p-6 text-white rounded-2xl mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Shared Groups</h1>
              <p className="text-green-100 mt-2 text-sm sm:text-base">Collaborate with others on shared tasks</p>
            </div>
            <Link
              to="/"
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition text-xs sm:text-base"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex flex-wrap gap-2 sm:gap-8">
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-groups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Groups ({sharedGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'discover'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Discover Public Groups
            </button>
          </nav>
        </div>

        {/* Floating Dropdown Action Menu */}
        <FloatingActionMenu 
          onCreateGroup={() => setShowCreateModal(true)}
          onJoinGroup={() => setShowJoinModal(true)}
          onRefresh={fetchSharedGroups}
        />

        {/* Content */}
        {activeTab === 'my-groups' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Your Shared Groups</h2>
              <p className="text-gray-600 text-sm mt-1">Manage and collaborate on your shared task groups</p>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : sharedGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No shared groups yet. Create your first group!
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sharedGroups.map(group => (
                  <SharedGroupCard
                    key={group._id}
                    group={group}
                    isPublic={group.isPublic}
                    userRole={getUserRole(group)}
                    onRefresh={fetchSharedGroups}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Discover Public Groups</h2>
              <p className="text-gray-600 text-sm mb-4">Find and join public groups to collaborate with others</p>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search public groups by name or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>

              {/* Role Information Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-6 border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Role Permissions</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Object.entries(rolePermissions).map(([role, info]) => (
                    <div key={role} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                          {info.name}
                        </span>
                        <RoleInfo role={role} />
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {info.permissions.slice(0, 2).map((permission, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-1">•</span>
                            {permission}
                          </li>
                        ))}
                        {info.permissions.length > 2 && (
                          <li className="text-gray-400 italic">+{info.permissions.length - 2} more...</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="mb-6">
                {publicGroups.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Search Results ({publicGroups.length})
                      </h3>
                      <span className="text-sm text-gray-500">
                        Showing results for "{searchQuery}"
                      </span>
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {publicGroups.map(group => {
                        const alreadyJoined = group.members.some(member => member.user === user.id);
                        return (
                          <SharedGroupCard
                            key={group._id}
                            group={group}
                            userRole="none"
                            isPublic={true}
                            onRefresh={fetchSharedGroups}
                            alreadyJoined={alreadyJoined}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
                    <p className="text-gray-500 mb-4">
                      No public groups match your search for "{searchQuery}"
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setPublicGroups([]);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State for Discover Tab */}
            {!searchQuery && publicGroups.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Discover Public Groups</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Search for public groups to join and collaborate with others on shared tasks and projects.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => document.querySelector('input[placeholder*="Search"]').focus()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Start Searching
                  </button>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                  >
                    Join Private Group
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateSharedGroupModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateGroup}
          />
        )}

        {showJoinModal && (
          <JoinGroupModal
            onClose={() => setShowJoinModal(false)}
            onSubmit={handleJoinGroup}
          />
        )}
      </div>
    </div>
  );
};

export default SharedGroupsPage;