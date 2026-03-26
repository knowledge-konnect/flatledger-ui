import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types/api';
import { logger } from '../lib/logger';

// Get API base URL from environment variables
const _rawApiUrl: string = 
  (import.meta as any).env?.VITE_APP_API_URL ||
  (import.meta as any).env?.REACT_APP_API_URL ||
  (() => {
    throw new Error('API URL not configured. Please set VITE_APP_API_URL in your .env file.');
  })();

// All backend routes are mounted under /api — append it once here so every
// relative path (e.g. '/users', '/flats') resolves to '<host>/api/users'.
const BASE_API_URL: string = _rawApiUrl.replace(/\/+$/, '') + '/api';

// ---------------------------------------------------------------------------
// In-memory access token — never written to localStorage or any browser storage.
// The refreshToken is managed entirely by the backend as an httpOnly cookie.
// ---------------------------------------------------------------------------
let inMemoryAccessToken: string | null = null;

export const setInMemoryAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getInMemoryAccessToken = (): string | null => inMemoryAccessToken;

// Callback for refreshing access token (set by AuthProvider)
let refreshAccessTokenCallback: (() => Promise<string | null>) | null = null;

// Export function to register the refresh callback from AuthProvider
export const setRefreshTokenCallback = (callback: () => Promise<string | null>) => {
  refreshAccessTokenCallback = callback;
};

// Global toast callback — registered by ToastProvider so the interceptor can
// show messages without depending on React context or hooks.
type ToastType = 'error' | 'warning' | 'info' | 'success';
let _showGlobalToast: ((message: string, type?: ToastType) => void) | null = null;
export const setGlobalToastCallback = (fn: ((message: string, type?: ToastType) => void) | null) => {
  _showGlobalToast = fn;
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
  withCredentials: true, // Send httpOnly cookies (refreshToken) on every request
});

// Endpoints that must NOT carry an Authorization header
const UNAUTHENTICATED_PATHS = ['/api/auth/refresh', '/api/auth/login', '/api/auth/register'];

// Request interceptor - attach Authorization header with accessToken
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip auth header for unauthenticated endpoints (login, register, token refresh)
    const url = config.url || '';
    const isUnauthenticated = UNAUTHENTICATED_PATHS.some(path => url.includes(path));

    if (!isUnauthenticated) {
      // Read access token from memory only — never from localStorage
      if (inMemoryAccessToken) {
        config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
      }
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
      // Never retry token-refresh or login requests — avoids infinite loops
      const requestUrl = originalRequest.url || '';
      const isAuthEndpoint = UNAUTHENTICATED_PATHS.some(path => requestUrl.includes(path));
      if (isAuthEndpoint) {
        logger.log('[API Client] Auth endpoint returned 401, not retrying');
        return Promise.reject(error);
      }

      // Flag to prevent infinite retry loops - only retry once
      if ((originalRequest as any)._retry) {
        logger.log('[API Client] Request already retried, rejecting');
        return Promise.reject(error);
      }

      // Mark this request as retried
      (originalRequest as any)._retry = true;

      // Check if refresh callback is registered
      if (!refreshAccessTokenCallback) {
        logger.warn('[API Client] No refresh token callback registered');
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          logger.log('[API Client] Attempting to refresh access token');
          
          // Attempt refreshAccessToken() from AuthProvider
          const newAccessToken = await refreshAccessTokenCallback();
          
          if (newAccessToken) {
            // Refresh succeeded — update in-memory token
            logger.log('[API Client] Token refreshed successfully');
            setInMemoryAccessToken(newAccessToken);
            
            // Notify all waiting requests
            onRefreshed(newAccessToken);
            isRefreshing = false;

            // Retry original request once with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } else {
            // Refresh failed — clear in-memory token, AuthProvider.logout() was called
            setInMemoryAccessToken(null);
            isRefreshing = false;
            refreshSubscribers = [];
            
            logger.error('[API Client] Token refresh failed, logout initiated');
            
            // Redirect to /login if not already there
            if (!isRedirecting && !window.location.pathname.includes('/login')) {
              isRedirecting = true;
              setTimeout(() => {
                isRedirecting = false;
                window.location.href = '/login?reason=session_expired';
              }, 100);
            }
            
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Exception during refresh
          isRefreshing = false;
          refreshSubscribers = [];
          
          logger.error('[API Client] Exception during token refresh', refreshError);
          
          // Redirect to /login
          if (!isRedirecting && !window.location.pathname.includes('/login')) {
            isRedirecting = true;
            setTimeout(() => {
              isRedirecting = false;
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

    // Rate limit — show a global toast and let the caller decide further UI changes
    if (error.response?.status === 429) {
      _showGlobalToast?.('Too many attempts. Please wait a minute and try again.', 'error');
    }

    // Not a 401/429 error (or 429 already handled above), reject normally
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
