import axios from 'axios';

// Base URL of the backend API - use environment variable if available
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true // For CORS with credentials
});

// Error handler function
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const message = error.response.data.message || `Server error: ${error.response.status}`;
    throw new Error(message);
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response from server. Please check your connection and try again.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw error;
  }
};

// API service functions
export const apiService = {
  // Start scraping process
  startScraping: async (data) => {
    try {
      const response = await api.post('/scrape', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Abort scraping process
  abortScraping: async () => {
    try {
      const response = await api.post('/abort');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create ZIP file
  createZip: async (folderName) => {
    try {
      const response = await api.post('/create-zip', { folderName });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  
  // Get event source for real-time logging
  getEventSource: () => {
    return new EventSource(`${API_URL}/stream`);
  }
};
