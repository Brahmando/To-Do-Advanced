
import React, { useState } from 'react';

const CreateSharedGroupModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    accessKey: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Group name is required');
      return;
    }
    if (!formData.isPublic && !formData.accessKey.trim()) {
      alert('Access key is required for private groups');
      return;
    }
    onSubmit(formData);
  };

  const generateAccessKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, accessKey: result }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Shared Group</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group description"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="groupType"
                  checked={formData.isPublic}
                  onChange={() => setFormData(prev => ({ ...prev, isPublic: true, accessKey: '' }))}
                  className="mr-2"
                />
                <span>Public (Anyone can join and view)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="groupType"
                  checked={!formData.isPublic}
                  onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                  className="mr-2"
                />
                <span>Private (Requires access key)</span>
              </label>
            </div>
          </div>

          {!formData.isPublic && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Key *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.accessKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessKey: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter access key"
                  required
                />
                <button
                  type="button"
                  onClick={generateAccessKey}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Generate
                </button>
              </div>
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
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSharedGroupModal;
