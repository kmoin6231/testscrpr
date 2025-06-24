import axios from 'axios';

// Base URL of the backend API - use environment variable if available, or relative path in production
const API_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative paths in production
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001');

// Create an axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased to 60 seconds for slow server startup
  withCredentials: false // Changed to false to avoid CORS preflight issues
});

// Add retry interceptor
api.interceptors.response.use(undefined, async (err) => {
  const { config } = err; // Removed unused 'message' variable
  if (!config || !config.retry) {
    return Promise.reject(err);
  }
  
  // Set the retry count
  config.retryCount = config.retryCount || 0;
  
  // Check if we've maxed out the total number of retries
  if (config.retryCount >= config.retry) {
    console.error(`Max retries (${config.retry}) reached for request:`, config.url);
    return Promise.reject(err);
  }
  
  // Increase the retry count
  config.retryCount += 1;
  console.log(`Retrying request (${config.retryCount}/${config.retry}): ${config.url}`);
  
  // Create new promise to handle backoff
  const backoff = new Promise((resolve) => {
    setTimeout(() => resolve(), config.retryDelay || 1000);
  });
  
  // Return the promise in which recalls axios to retry the request
  await backoff;
  return api(config);
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
      const response = await api.post('/scrape', data, {
        retry: 3, // Retry up to 3 times
        retryDelay: 2000 // Wait 2 seconds between retries
      });
      return response.data;
    } catch (error) {
      console.error('Scraping request failed:', error);
      handleApiError(error);
    }
  },

  // Abort scraping process
  abortScraping: async () => {
    try {
      const response = await api.post('/abort', {}, {
        retry: 2,
        retryDelay: 1000
      });
      return response.data;
    } catch (error) {
      console.error('Abort request failed:', error);
      handleApiError(error);
    }
  },

  // Create ZIP file
  createZip: async (folderName) => {
    try {
      const response = await api.post('/create-zip', { folderName }, {
        retry: 2,
        retryDelay: 1000
      });
      return response.data;
    } catch (error) {
      console.error('Create ZIP request failed:', error);
      handleApiError(error);
    }
  },
  
  // Get download progress
  getDownloadProgress: async () => {
    try {
      const response = await api.get('/download-progress', {
        retry: 2,
        retryDelay: 1000
      });
      return response.data;
    } catch (error) {
      console.error('Download progress request failed:', error);
      // Don't throw for progress requests to avoid breaking the UI
      return { downloadProgress: {}, totalFiles: 0, completedFiles: 0, totalSize: 0 };
    }
  },

  // Get event source for real-time logging
  getEventSource: () => {
    // Check if EventSource is supported
    if (typeof EventSource === 'undefined') {
      console.error('EventSource not supported in this browser');
      return null;
    }
    
    try {
      return new EventSource(`${API_URL}/stream`);
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      return null;
    }
  },

  // Test scraping configuration
  testScraping: async (data) => {
    try {
      const response = await api.post('/test-scrape', data, {
        retry: 2,
        retryDelay: 1500
      });
      return response.data;
    } catch (error) {
      console.error('Test scraping request failed:', error);
      handleApiError(error);
    }
  },
  
  // Download a file
  downloadFile: async (folderName, fileName) => {
    try {
      // Create a download URL
      const downloadUrl = `${API_URL}/download-file?folder=${encodeURIComponent(folderName)}&file=${encodeURIComponent(fileName)}`;
      
      console.log(`Attempting to download file from: ${downloadUrl}`);
      
      // Use fetch with blob response to handle file downloads
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Download error (${response.status}):`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Check if it's a PDF and validate the content type
      if (fileName.toLowerCase().endsWith('.pdf')) {
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/pdf')) {
          console.warn('Warning: PDF file does not have PDF content type:', contentType);
        }
      }
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create an anchor element and set its properties
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Use the suggested filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      const suggestedFilename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : fileName;
      a.download = suggestedFilename || fileName;
      
      // Append to the DOM, trigger the download, and clean up
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error('File download failed:', error);
      throw new Error(`Download failed: ${error.message || 'Unknown error'}`);
    }
  },
  
  // Download a zip file
  downloadZipFile: async (folderName) => {
    try {
      // Create a download URL for the ZIP file
      const downloadUrl = `${API_URL}/download-zip?folder=${encodeURIComponent(folderName)}`;
      
      // Use fetch with blob response to handle file downloads
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create an anchor element and set its properties
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${folderName}.zip`;
      
      // Append to the DOM, trigger the download, and clean up
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error('ZIP download failed:', error);
      throw new Error(`Download failed: ${error.message || 'Unknown error'}`);
    }
  },

  // Check if the server is online
  checkServerStatus: async () => {
    try {
      // Send a simple request to check server availability
      await api.get('/download-progress', { 
        timeout: 10000, // Short timeout
        retry: 1,
        retryDelay: 1000
      });
      return true;
    } catch (error) {
      console.error('Server status check failed:', error);
      return false;
    }
  },

  // Check if a file exists before attempting to download
  checkFileExists: async (folderName, fileName) => {
    try {
      const response = await api.get(`/check-file?folder=${encodeURIComponent(folderName)}&file=${encodeURIComponent(fileName)}`);
      return response.data;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return { exists: false, error: error.message };
    }
  },

  // Get scraping status
  getScrapingStatus: async () => {
    try {
      const response = await api.get('/scraping-status');
      return response.data;
    } catch (error) {
      console.error('Error checking scraping status:', error);
      return { isScrapingActive: false, error: error.message };
    }
  },
  
  // Reset scraping status
  resetScraping: async (clearLogs = false) => {
    try {
      const response = await api.post(`/reset-scraping?clearLogs=${clearLogs}`);
      return response.data;
    } catch (error) {
      console.error('Error resetting scraping status:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Start scraping with force option
  startScrapingWithForce: async (params, force = false) => {
    try {
      const response = await api.post(`/scrape?force=${force}`, params, {
        retry: 3,
        retryDelay: 1000
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
