import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  deleteSharedGroup,
  addTaskToSharedGroup,
  updateTaskInSharedGroup,
  completeTaskInSharedGroup,
  deleteTaskFromSharedGroup,
  reorderTasksInSharedGroup,
  requestRoleUpgrade,
  getUserRoleUpgradeStatus,
  exitGroup,
  transferOwnership,
  updateMemberRole,
  removeMember
} from '../services/sharedGroupService';

const SharedGroupDetail = ({ user }) => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRoleUpgradeModal, setShowRoleUpgradeModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('');
  const [commitAction, setCommitAction] = useState(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [newTask, setNewTask] = useState({ text: '', date: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [roleUpgradeStatus, setRoleUpgradeStatus] = useState(null);
  const [selectedUpgradeRole, setSelectedUpgradeRole] = useState('medium');
  const [showAccessKeyCopied, setShowAccessKeyCopied] = useState(false);

  // Update selected role when modal opens to ensure it's valid
  const getDefaultUpgradeRole = () => {
    const currentRole = getUserRole();
    if (currentRole === 'observer') return 'medium';
    if (currentRole === 'medium') return 'collaborator';
    if (currentRole === 'collaborator') return 'medium';
    return 'medium';
  };
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroup();
    fetchRoleUpgradeStatus();
  }, [id]);

  // Add interval to refresh group data periodically to catch role updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGroup();
      fetchRoleUpgradeStatus();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [id]);

  const fetchRoleUpgradeStatus = async () => {
    try {
      const status = await getUserRoleUpgradeStatus(id);
      setRoleUpgradeStatus(status);
    } catch (error) {
      console.error('Error fetching role upgrade status:', error);
    }
  };

  const fetchGroup = async () => {
    try {
      const groupData = await getSharedGroup(id);
      console.log('Group data:', groupData);
      console.log('Is private:', groupData?.isPrivate);
      console.log('Access key exists:', !!groupData?.accessKey);
      console.log('Current user ID:', user?.id);
      console.log('Group owner ID:', groupData?.owner);
      console.log('Is current user owner:', user?.id === groupData?.owner);
      console.log('Group members:', groupData?.members);
      
      // Log the condition that should show the button
      const showButton = !groupData?.isPublic && user?.id === groupData?.owner;
      console.log('Should show copy access key button:', showButton, 'because isPublic:', groupData?.isPublic, 'and isOwner:', user?.id === groupData?.owner);
      
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
        const result = await commitAction(commitMessage);

        // For reorder actions, update the state with the server's response
        if (commitAction.toString().includes('reorderTasksInSharedGroup') && result && result.tasks) {
          setGroup(prevGroup => ({
            ...prevGroup,
            tasks: result.tasks
          }));
        } else if (!commitAction.toString().includes('reorderTasksInSharedGroup')) {
          // For other actions, refetch the group
          fetchGroup();
        }

        setShowCommitModal(false);
        setCommitMessage('');
        setCommitAction(null);
      } catch (error) {
        console.error('Error executing action:', error);
        alert('Failed to execute action.');
        // On error, refetch to ensure we're in sync with the server
        fetchGroup();
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


  const handleDeleteGroup = async (groupId, commitMessage) => {
    try {
      await deleteSharedGroup(groupId, commitMessage);
      // Redirect after successful deletion
      navigate('/shared-groups');
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    handleDeleteGroup(group._id, `Deleted group: ${group.name}`);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleCopyAccessKey = () => {
    if (group?.accessKey) {
      navigator.clipboard.writeText(group.accessKey);
      setShowAccessKeyCopied(true);
      setTimeout(() => setShowAccessKeyCopied(false), 2000);
    }
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
    if (active.id === over.id) return;

    // Create a new array of tasks to avoid mutating the state directly
    const updatedTasks = [...group.tasks];

    // Find the indexes of the active and over tasks in the full tasks array
    const activeIndex = updatedTasks.findIndex(task => task._id === active.id);
    const overIndex = updatedTasks.findIndex(task => task._id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    // Store the original order in case we need to revert
    const originalTasks = JSON.parse(JSON.stringify(group.tasks));

    // Move the task in the local state
    const [movedTask] = updatedTasks.splice(activeIndex, 1);
    updatedTasks.splice(overIndex, 0, movedTask);

    // Update the order property for all tasks
    const tasksWithUpdatedOrder = updatedTasks.map((task, index) => ({
      ...task,
      order: index
    }));

    console.log('Local reorder - New order:', tasksWithUpdatedOrder.map(t => ({
      _id: t._id,
      text: t.text,
      order: t.order
    })));

    // Update the local state immediately for a smooth UX
    setGroup(prevGroup => ({
      ...prevGroup,
      tasks: tasksWithUpdatedOrder
    }));

    // Create a promise for the reorder operation
    const reorderPromise = (message) => {
      console.log('Sending reorder to server');
      return new Promise((resolve, reject) => {
        const taskIds = tasksWithUpdatedOrder.map(task => task._id);

        reorderTasksInSharedGroup(id, taskIds, message)
          .then(result => {
            console.log('Server response:', result);
            if (result && result.tasks) {
              // Ensure the server's response has tasks in the correct order
              const serverTasks = [...result.tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
              console.log('Updating local state with server response');

              setGroup(prevGroup => ({
                ...prevGroup,
                tasks: serverTasks
              }));
            }
            resolve(result);
          })
          .catch(error => {
            console.error('Error in reorder operation:', error);
            // On error, revert to the original order
            setGroup(prevGroup => ({
              ...prevGroup,
              tasks: originalTasks
            }));
            reject(error);
          });
      });
    };

    // Execute the reorder with the commit modal
    executeWithCommit(reorderPromise, 'Reordered tasks');
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
      owner: 'bg-green-100 text-green-800',
      collaborator: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      observer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const handleRoleClick = () => {
    const userRole = getUserRole();
    // Allow all users except owners to request role upgrades
    if (userRole !== 'owner') {
      setSelectedUpgradeRole(getDefaultUpgradeRole());
      setShowRoleUpgradeModal(true);
    }
  };

  const handleRoleUpgradeRequest = async () => {
    try {
      const response = await requestRoleUpgrade(id, {
        requestedRole: selectedUpgradeRole,
        message: upgradeMessage
      });
      
      alert(response.notification);
      setShowRoleUpgradeModal(false);
      setUpgradeMessage('');
      fetchRoleUpgradeStatus(); // Refresh status
    } catch (error) {
      alert(error.message);
    }
  };

  const handleExitGroup = async () => {
    try {
      await exitGroup(id);
      alert('Successfully exited the group');
      navigate('/shared-groups');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleTransferOwnership = async () => {
    try {
      await transferOwnership(id, selectedNewOwner);
      alert('Ownership transferred successfully');
      setShowTransferOwnershipModal(false);
      fetchGroup(); // Refresh group data
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateMemberRole(id, memberId, newRole);
      alert('Member role updated successfully');
      fetchGroup(); // Refresh group data
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(id, memberId);
        alert('Member removed successfully');
        fetchGroup(); // Refresh group data
      } catch (error) {
        alert(error.message);
      }
    }
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

  // Filter and sort tasks by their order property
  const activeTasks = [...group.tasks]
    .filter(task => !task.completed && !task.deleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const completedTasks = [...group.tasks]
    .filter(task => task.completed && !task.deleted)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const userRole = getUserRole();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
                  {!group.isPublic && group.owner === user?.id && (
                    <div className="relative">
                      <div className="relative group">
                        <button
                          onClick={handleCopyAccessKey}
                          className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-all duration-200 shadow-sm"
                          title="Copy access key to share with others"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
                            />
                          </svg>
                          <span>Access Key</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3.5 w-3.5 ml-0.5 opacity-70" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" 
                            />
                          </svg>
                        </button>
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-amber-300 group-hover:w-[calc(100%-0.5rem)] transition-all duration-300"></div>
                        
                        {showAccessKeyCopied && (
                          <div className="absolute left-0 -bottom-9 bg-green-100 text-green-800 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-md border border-green-200 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Copied to clipboard!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {group.description && (
                  <p className="text-gray-600 mt-1">{group.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span 
                className={`px-3 py-1 rounded-full text-sm cursor-pointer hover:opacity-80 ${getRoleColor(userRole)} ${userRole !== 'owner' ? 'hover:ring-2 hover:ring-blue-300' : ''}`}
                onClick={handleRoleClick}
                title={userRole !== 'owner' ? 'Click to request role upgrade' : ''}
              >
                {userRole}
                {roleUpgradeStatus?.hasPendingRequest && (
                  <span className="ml-1 text-xs">(Pending)</span>
                )}
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
              {canDelete() && (
                <>
                  <button
                    onClick={handleDeleteClick}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Delete Group
                  </button>
                  {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                      <div className="bg-white p-7 rounded-2xl shadow-2xl max-w-sm w-full mx-3 border-2 border-red-200">
                        <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center">
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-2 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                          Delete Group?
                        </h3>
                        <p className="text-gray-700 mb-6">This action cannot be undone. All tasks, members, and history will be <span className='font-semibold text-red-600'>permanently deleted</span>.<br/>Are you sure you want to delete <span className='font-semibold'>{group.name}</span>?</p>
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={handleCancelDelete}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                          >
                            Yes, Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => setShowExitModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Exit Group
              </button>

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
                  value={editingTask.date ? editingTask.date.slice(0, 16) : ''}
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

        {/* Role Upgrade Request Modal */}
        {showRoleUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Request Role Upgrade</h3>
                <button
                  onClick={() => setShowRoleUpgradeModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {roleUpgradeStatus?.hasPendingRequest ? (
                <div className="text-center py-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 font-medium mb-2">
                      Request Pending
                    </p>
                    <p className="text-sm text-yellow-700">
                      You have requested to upgrade to <strong>{roleUpgradeStatus.requestedRole}</strong> role.
                    </p>
                    {roleUpgradeStatus.daysLeft > 0 && (
                      <p className="text-xs text-yellow-600 mt-2">
                        Wait {roleUpgradeStatus.daysLeft} more day(s) before requesting again.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowRoleUpgradeModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Request the group owner to upgrade your role from <strong>{getUserRole()}</strong> to:
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requested Role
                    </label>
                    <select
                      value={selectedUpgradeRole}
                      onChange={(e) => setSelectedUpgradeRole(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {/* Always show both options, but exclude current role */}
                      {getUserRole() !== 'medium' && (
                        <option value="medium">Medium Access</option>
                      )}
                      {getUserRole() !== 'collaborator' && (
                        <option value="collaborator">Collaborator</option>
                      )}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={upgradeMessage}
                      onChange={(e) => setUpgradeMessage(e.target.value)}
                      placeholder="Explain why you need this role upgrade..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowRoleUpgradeModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRoleUpgradeRequest}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exit Group Modal */}
        {showExitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Exit Group</h3>
                <button
                  onClick={() => setShowExitModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {getUserRole() === 'owner' ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    As the owner, you must transfer ownership to another member before exiting the group.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer ownership to:
                    </label>
                    <select
                      value={selectedNewOwner}
                      onChange={(e) => setSelectedNewOwner(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a member...</option>
                      {group.members
                        .filter(member => member.user !== user.id && member.role !== 'owner')
                        .map(member => (
                          <option key={member.user} value={member.user}>
                            {member.userName} ({member.role})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowExitModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (selectedNewOwner) {
                          setShowExitModal(false);
                          setShowTransferOwnershipModal(true);
                        } else {
                          alert('Please select a member to transfer ownership to.');
                        }
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                      disabled={!selectedNewOwner}
                    >
                      Transfer & Exit
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to exit this group? You will lose access to all tasks and discussions.
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowExitModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowExitModal(false);
                        handleExitGroup();
                      }}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg"
                    >
                      Exit Group
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transfer Ownership Modal */}
        {showTransferOwnershipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Confirm Transfer</h3>
                <button
                  onClick={() => setShowTransferOwnershipModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to transfer ownership to{' '}
                  <strong>
                    {group.members.find(m => m.user === selectedNewOwner)?.userName}
                  </strong>?
                  You will become a collaborator and then exit the group.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowTransferOwnershipModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await handleTransferOwnership();
                      // After successful transfer, exit the group
                      setTimeout(() => {
                        handleExitGroup();
                      }, 1000);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
                  >
                    Confirm Transfer & Exit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedGroupDetail;
