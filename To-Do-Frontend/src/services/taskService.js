const API_BASE_URL = 'https://7b4d9b7a-2b69-418f-9a38-967642d11a06-00-jfikp0pli8zu.sisko.replit.dev:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const getTasks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (task) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const completeTask = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/complete`, {
      method: 'PUT',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const undoTask = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/undo`, {
      method: 'PUT',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error undoing task:', error);
    throw error;
  }
};

export const editTask = async (id, taskData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error editing task:', error);
    throw error;
  }
};