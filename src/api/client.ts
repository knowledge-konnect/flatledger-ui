import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types/api';

// Get API base URL from environment variables
const BASE_API_URL: string = 
  (import.meta as any).env?.VITE_APP_API_URL ||
  (import.meta as any).env?.REACT_APP_API_URL ||
  (() => {
    console.error(
      '❌ VITE_APP_API_URL is not defined in environment variables.\n' +
      'Please create a .env file with VITE_APP_API_URL=<your-api-url>\n' +
      'See .env.example for reference.'
    );
    throw new Error('API URL not configured. Please set VITE_APP_API_URL in your .env file.');
  })();

// Callback for refreshing access token (set by AuthProvider)
let refreshAccessTokenCallback: (() => Promise<string | null>) | null = null;

// Export function to register the refresh callback from AuthProvider
export const setRefreshTokenCallback = (callback: () => Promise<string | null>) => {
  refreshAccessTokenCallback = callback;
};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let isRedirecting = false; // Prevent multiple redirects

function onRefreshed(token: string): void {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - attach Authorization header with accessToken
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get accessToken from localStorage
    const accessToken = localStorage.getItem('accessToken');
    
    // Skip if no token available
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors with token refresh
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // If response status is 401, attempt token refresh
    if (error.response?.status === 401) {
      // Flag to prevent infinite retry loops - only retry once
      if ((originalRequest as any)._retry) {
        console.log('[API Client] Request already retried, rejecting');
        return Promise.reject(error);
      }

      // Mark this request as retried
      (originalRequest as any)._retry = true;

      // Check if refresh callback is registered
      if (!refreshAccessTokenCallback) {
        console.warn('[API Client] No refresh token callback registered');
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          console.log('[API Client] Attempting to refresh access token');
          
          // Attempt refreshAccessToken() from AuthProvider
          const newAccessToken = await refreshAccessTokenCallback();
          
          if (newAccessToken) {
            // Refresh succeeded
            console.log('[API Client] Token refreshed successfully');
            
            // Notify all waiting requests
            onRefreshed(newAccessToken);
            isRefreshing = false;

            // Retry original request once with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } else {
            // Refresh failed - AuthProvider.logout() was called
            isRefreshing = false;
            refreshSubscribers = [];
            
            console.error('[API Client] Token refresh failed, logout initiated');
            
            // Redirect to /login if not already there
            if (!isRedirecting && !window.location.pathname.includes('/login')) {
              isRedirecting = true;
              console.log('[API Client] Redirecting to /login due to auth failure');
              setTimeout(() => {
                window.location.href = '/login?reason=session_expired';
              }, 100);
            }
            
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Exception during refresh
          isRefreshing = false;
          refreshSubscribers = [];
          
          console.error('[API Client] Exception during token refresh', refreshError);
          
          // Redirect to /login
          if (!isRedirecting && !window.location.pathname.includes('/login')) {
            isRedirecting = true;
            setTimeout(() => {
              window.location.href = '/login?reason=session_expired';
            }, 100);
          }
          
          return Promise.reject(refreshError);
        }
      }

      // If a refresh is already in progress, wait for it
      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    // Not a 401 error, reject normally
    return Promise.reject(error);
  }
);


// Error handling utilities following API documentation
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const response = error.response.data;
    return {
      code: response.code || 'UNKNOWN_ERROR',
      message: response.message || 'An unexpected error occurred',
      details: {
        status: error.response.status,
        errors: response.errors || [],
        traceId: response.traceId,
      },
    };
  }
  
  if (axios.isAxiosError(error) && error.request) {
    // Network error
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
    };
  }
  
  // Unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
};

/**
 * Maps API error to user-friendly messages and categorizes error types
 * Based on HTTP status codes and error codes from API documentation
 */
export const categorizeApiError = (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.response) {
    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
    };
  }

  const { status, data } = error.response;
  
  switch (status) {
    case 400:
      // Validation errors or bad request
      if (data.errors && data.errors.length > 0) {
        const validationErrors: Record<string, string[]> = {};
        data.errors.forEach((err: any) => {
          validationErrors[err.field] = err.messages;
        });
        return {
          type: 'validation',
          message: data.message || 'Validation errors occurred',
          errors: validationErrors,
        };
      }
      return {
        type: 'bad_request',
        message: data.message || 'Invalid request',
      };

    case 401:
      return {
        type: 'unauthorized',
        message: data.message || 'Please log in again',
        code: data.code,
      };

    case 403:
      return {
        type: 'forbidden',
        message: data.message || 'Insufficient permissions or subscription required',
        code: data.code,
      };

    case 404:
      return {
        type: 'not_found',
        message: data.message || 'Resource not found',
      };

    case 409:
      return {
        type: 'conflict',
        message: data.message || 'Resource already exists',
      };

    case 429:
      return {
        type: 'rate_limit',
        message: 'Too many requests. Please try again later.',
      };

    case 500:
      return {
        type: 'server_error',
        message: 'An unexpected server error occurred. Please try again.',
        traceId: data.traceId,
      };

    default:
      return {
        type: 'unknown',
        message: data.message || 'An error occurred',
      };
  }
};

export default apiClient;
