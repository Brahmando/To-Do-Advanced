import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getSharedGroups, 
  searchPublicGroups, 
  createSharedGroup, 
  joinSharedGroup
} from '../services/sharedGroupService';
import CreateSharedGroupModal from './CreateSharedGroupModal';
import JoinGroupModal from './JoinGroupModal';
import SharedGroupCard from './SharedGroupCard';

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
  }, []);

  const fetchSharedGroups = async () => {
    try {
      const groups = await getSharedGroups();
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
      await joinSharedGroup(joinData.groupId, joinData);
      setShowJoinModal(false);
      fetchSharedGroups();
      alert('Successfully joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group. Please check your credentials.');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white rounded-2xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Shared Groups</h1>
              <p className="text-green-100 mt-2">Collaborate with others on shared tasks</p>
            </div>
            <Link
              to="/"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
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

        {/* Content */}
        {activeTab === 'my-groups' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Shared Groups</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Group</span>
              </button>
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
              <div className="flex space-x-4 mb-4">
                <input
                  type="text"
                  placeholder="Search public groups..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg whitespace-nowrap"
                >
                  Join Private Group
                </button>
              </div>

              {/* Role Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3">Role Permissions:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(rolePermissions).map(([role, info]) => (
                    <div key={role} className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${info.color}`}>
                        {info.name}
                      </span>
                      <RoleInfo role={role} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {publicGroups.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Public Groups</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {publicGroups.map(group => (
                    <SharedGroupCard
                      key={group._id}
                      group={group}
                      userRole="none"
                      isPublic={true}
                      onRefresh={fetchSharedGroups}
                    />
                  ))}
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