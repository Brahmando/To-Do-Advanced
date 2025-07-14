
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  getSharedGroup, 
  addTaskToSharedGroup, 
  updateTaskInSharedGroup,
  completeTaskInSharedGroup, 
  deleteTaskFromSharedGroup,
  reorderTasksInSharedGroup 
} from '../services/sharedGroupService';

const SharedGroupDetail = ({ user }) => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [commitAction, setCommitAction] = useState(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [newTask, setNewTask] = useState({ text: '', date: '' });
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const groupData = await getSharedGroup(id);
      setGroup(groupData);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = () => {
    const member = group?.members.find(m => m.user === user.id);
    return member ? member.role : 'observer';
  };

  const canEdit = () => {
    const role = getUserRole();
    return ['owner', 'collaborator', 'medium'].includes(role);
  };

  const canDelete = () => {
    const role = getUserRole();
    return ['owner', 'collaborator'].includes(role);
  };

  const canEditTask = (task) => {
    const role = getUserRole();
    if (role === 'medium') {
      return task.createdBy === user.id;
    }
    return ['owner', 'collaborator'].includes(role);
  };

  const executeWithCommit = (action, defaultMessage) => {
    setCommitAction(() => action);
    setCommitMessage(defaultMessage);
    setShowCommitModal(true);
  };

  const handleCommit = async () => {
    if (commitAction && commitMessage.trim()) {
      try {
        await commitAction(commitMessage);
        setShowCommitModal(false);
        setCommitMessage('');
        setCommitAction(null);
        fetchGroup();
      } catch (error) {
        console.error('Error executing action:', error);
        alert('Failed to execute action.');
      }
    }
  };

  const handleAddTask = () => {
    if (!newTask.text.trim() || !newTask.date) {
      alert('Please fill in all fields.');
      return;
    }

    executeWithCommit(
      (message) => addTaskToSharedGroup(id, { ...newTask, commitMessage: message }),
      `Added task: ${newTask.text}`
    );

    setNewTask({ text: '', date: '' });
    setShowAddTask(false);
  };

  const handleEditTask = (task) => {
    if (!canEditTask(task)) {
      alert('You can only edit your own tasks.');
      return;
    }
    setEditingTask({ ...task });
  };

  const handleUpdateTask = () => {
    if (!editingTask.text.trim() || !editingTask.date) {
      alert('Please fill in all fields.');
      return;
    }

    executeWithCommit(
      (message) => updateTaskInSharedGroup(id, editingTask._id, {
        text: editingTask.text,
        date: editingTask.date,
        commitMessage: message
      }),
      `Updated task: ${editingTask.text}`
    );

    setEditingTask(null);
  };

  const handleCompleteTask = (task) => {
    executeWithCommit(
      (message) => completeTaskInSharedGroup(id, task._id, message),
      `Completed task: ${task.text}`
    );
  };

  const handleDeleteTask = (task) => {
    if (!canDelete()) {
      alert('You do not have permission to delete tasks.');
      return;
    }

    executeWithCommit(
      (message) => deleteTaskFromSharedGroup(id, task._id, message),
      `Deleted task: ${task.text}`
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || !canEdit()) return;

    if (active.id !== over.id) {
      const items = Array.from(group.tasks.filter(task => !task.deleted && !task.completed));
      const oldIndex = items.findIndex(item => item._id === active.id);
      const newIndex = items.findIndex(item => item._id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      const taskIds = newItems.map(task => task._id);

      executeWithCommit(
        (message) => reorderTasksInSharedGroup(id, taskIds, message),
        'Reordered tasks'
      );
    }
  };

  const SortableTask = ({ task, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-gray-50 rounded-lg p-4 mb-3 ${isDragging ? 'shadow-lg' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {canEdit() && (
              <div
                {...attributes}
                {...listeners}
                className="text-gray-400 hover:text-gray-600 cursor-grab"
              >
                ⋮⋮
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-800">{task.text}</p>
              <p className="text-sm text-gray-500">
                Due: {formatDate(task.date)}
              </p>
              <p className="text-xs text-gray-400">
                Created by {task.createdByName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit() && (
              <button
                onClick={() => handleCompleteTask(task)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Complete
              </button>
            )}
            {canEditTask(task) && (
              <button
                onClick={() => handleEditTask(task)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Edit
              </button>
            )}
            {canDelete() && (
              <button
                onClick={() => handleDeleteTask(task)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      owner: 'bg-red-100 text-red-800',
      collaborator: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      observer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Group not found or access denied.</p>
          <Link to="/shared-groups" className="text-blue-500 hover:text-blue-600">
            ← Back to Shared Groups
          </Link>
        </div>
      </div>
    );
  }

  const activeTasks = group.tasks.filter(task => !task.deleted && !task.completed);
  const completedTasks = group.tasks.filter(task => task.completed && !task.deleted);
  const userRole = getUserRole();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
              {group.description && (
                <p className="text-gray-600 mt-1">{group.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm ${getRoleColor(userRole)}`}>
                {userRole}
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {group.totalChanges || 0} changes
              </span>
              <Link
                to="/shared-groups"
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                ← Back
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Owner: {group.ownerName}</span>
              <button 
                onClick={() => setShowMembersModal(true)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Members: {group.members.length}
              </button>
              <span>Active: {activeTasks.length}</span>
              <span>Completed: {completedTasks.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowChangeLog(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Change Log
              </button>
              {canEdit() && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-6">
          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Active Tasks</h2>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={activeTasks.map(task => task._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {activeTasks.map((task, index) => (
                    <SortableTask key={task._id} task={task} index={index} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Completed Tasks</h2>
              <div className="space-y-3">
                {completedTasks.map(task => (
                  <div key={task._id} className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 line-through">{task.text}</p>
                        <p className="text-sm text-gray-500">
                          Completed: {formatDate(task.completedAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Created by {task.createdByName}
                        </p>
                      </div>
                      <span className="text-green-600">✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Tasks */}
          {group.tasks.filter(task => task.deleted).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Deleted Tasks</h2>
              <div className="space-y-3">
                {group.tasks.filter(task => task.deleted).map(task => (
                  <div key={task._id} className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 line-through">{task.text}</p>
                        <p className="text-sm text-gray-500">
                          Deleted: {formatDate(task.deletedAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Created by {task.createdByName}
                        </p>
                      </div>
                      <span className="text-red-600">🗑️</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTasks.length === 0 && completedTasks.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 mb-4">No tasks yet in this group.</p>
              {canEdit() && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                >
                  Add First Task
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task description"
                  value={newTask.text}
                  onChange={(e) => setNewTask(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="datetime-local"
                  value={newTask.date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task description"
                  value={editingTask.text}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="datetime-local"
                  value={editingTask.date}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => setEditingTask(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTask}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                  >
                    Update Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commit Modal */}
        {showCommitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Commit Message</h3>
              <textarea
                placeholder="Describe what you changed..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                rows="3"
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowCommitModal(false);
                    setCommitMessage('');
                    setCommitAction(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!commitMessage.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg"
                >
                  Commit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Log Modal */}
        {showChangeLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Change Log</h3>
                <button
                  onClick={() => setShowChangeLog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {group.changeLog && group.changeLog.length > 0 ? (
                  group.changeLog.slice().reverse().map((log, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{log.userName}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.commitMessage}</p>
                      <span className="text-xs text-blue-600">{log.action}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No changes yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Group Members</h3>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {group.members && group.members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.userName}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                    {userRole === 'owner' && member.role !== 'owner' && (
                      <div className="flex space-x-1">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="observer">Observer</option>
                          <option value="medium">Medium</option>
                          <option value="collaborator">Collaborator</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.user)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedGroupDetail;
