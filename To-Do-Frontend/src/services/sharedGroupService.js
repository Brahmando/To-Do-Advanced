const API_BASE_URL = 'https://7b4d9b7a-2b69-418f-9a38-967642d11a06-00-jfikp0pli8zu.sisko.replit.dev:5000/api';

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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error joining shared group:', error);
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

export const reorderTasksInSharedGroup = async (groupId, taskIds, commitMessage) => {
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