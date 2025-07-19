const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const getSharedGroups = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching shared groups:', error);
    throw error;
  }
};

export const searchPublicGroups = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/search?query=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching groups:', error);
    throw error;
  }
};

export const getSharedGroup = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${id}`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching shared group:', error);
    throw error;
  }
};

export const createSharedGroup = async (groupData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating shared group:', error);
    throw error;
  }
};

export const createSharedGroupFromExisting = async (groupId, shareData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/from-group/${groupId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(shareData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating shared group from existing:', error);
    throw error;
  }
};

export const joinSharedGroup = async (groupId, joinData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(joinData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log('Error joining shared group:', error);
    throw error;
  }
};

export const handleJoinRequest = async (groupId, requestId, action) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/join-request/${requestId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error handling join request:', error);
    throw error;
  }
};

export const addTaskToSharedGroup = async (groupId, taskData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding task to shared group:', error);
    throw error;
  }
};

export const updateTaskInSharedGroup = async (groupId, taskId, taskData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating task in shared group:', error);
    throw error;
  }
};

export const completeTaskInSharedGroup = async (groupId, taskId, commitMessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/tasks/${taskId}/complete`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ commitMessage })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error completing task in shared group:', error);
    throw error;
  }
};

export const deleteTaskFromSharedGroup = async (groupId, taskId, commitMessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ commitMessage })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting task from shared group:', error);
    throw error;
  }
};

export const deleteSharedGroup = async (groupId, commitMessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/delete`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ commitMessage })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting shared group:', error);
    throw error;
  }
};

export const reorderTasksInSharedGroup = async (groupId, taskIds, commitMessage) => {
  console.log('coming here')
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/reorder`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ taskIds, commitMessage })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error reordering tasks in shared group:', error);
    throw error;
  }
};

export const getNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/user-notifications`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const getUserNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/user-notifications`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Role upgrade request functions
export const requestRoleUpgrade = async (groupId, requestData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/role-upgrade-request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting role upgrade:', error);
    throw error;
  }
};

export const getUserRoleUpgradeStatus = async (groupId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/role-upgrade-status`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching role upgrade status:', error);
    throw error;
  }
};

export const dismissNotification = async (groupId, requestId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/notifications/${groupId}/dismiss/${requestId}`, {
      method: 'PUT',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error dismissing notification:', error);
    throw error;
  }
};

export const exitGroup = async (groupId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/exit`, {
      method: 'POST',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exiting group:', error);
    throw error;
  }
};

export const transferOwnership = async (groupId, newOwnerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/transfer-ownership`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ newOwnerId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error transferring ownership:', error);
    throw error;
  }
};

export const updateMemberRole = async (groupId, memberId, newRole) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/members/${memberId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role: newRole })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
};

export const removeMember = async (groupId, memberId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shared-groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};