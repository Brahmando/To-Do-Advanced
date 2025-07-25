// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://to-do-advanced-production.up.railway.app/api';

export { API_BASE_URL };

// Helper function for making authenticated API calls
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
