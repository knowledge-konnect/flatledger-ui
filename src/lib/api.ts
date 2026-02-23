import axios from 'axios';

// Get API base URL from environment variables (legacy client - use src/api/client.ts instead)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (() => {
  console.error(
    '❌ VITE_API_BASE_URL is not defined in environment variables.\n' +
    'Please create a .env file with VITE_API_BASE_URL=<your-api-url>\n' +
    'See .env.example for reference.'
  );
  throw new Error('API URL not configured. Please set VITE_API_BASE_URL in your .env file.');
})();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
