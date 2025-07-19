
import React, { useState } from 'react';

const JoinGroupModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    groupName: '',
    accessKey: '',
    role: 'observer',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.groupName.trim()) {
      alert('Group name is required');
      return;
    }
    if (!formData.accessKey.trim()) {
      alert('Access key is required');
      return;
    }
    onSubmit(formData);
  };

  const roles = [
    { value: 'observer', label: 'Observer', desc: 'View only access' },
    { value: 'medium', label: 'Medium Access', desc: 'Add tasks and edit own tasks' },
    { value: 'collaborator', label: 'Collaborator', desc: 'Full access except deleting group' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Join Private Group</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.groupName}
              onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Key *
            </label>
            <input
              type="text"
              value={formData.accessKey}
              onChange={(e) => setFormData(prev => ({ ...prev, accessKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter access key"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Role
            </label>
            <div className="space-y-2">
              {roles.map(role => (
                <label key={role.value} className="flex items-start">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="mr-2 mt-1"
                  />
                  <div>
                    <span className="font-medium">{role.label}</span>
                    <p className="text-sm text-gray-600">{role.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {formData.role !== 'observer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message to Owner (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Why do you want to join this group?"
                rows="3"
              />
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
            >
              Join Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupModal;
