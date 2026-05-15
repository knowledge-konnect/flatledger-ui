import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types/api';
import { logger } from '../lib/logger';
import { getGlobalToastFn } from '../lib/toastBridge';

// Get API base URL from environment variables
const _rawApiUrl: string =
  (import.meta.env.VITE_APP_API_URL as string | undefined) ??
  (() => {
    throw new Error('API URL not configured. Please set VITE_APP_API_URL in your .env file.');
  })();

// All backend routes are mounted under /api — append it once here so every
// relative path (e.g. '/users', '/flats') resolves to '<host>/api/users'.
const BASE_API_URL: string = _rawApiUrl.replace(/\/+$/, '') + '/api';

// ---------------------------------------------------------------------------
// In-memory access token — never written to localStorage or any browser storage.
// Storing tokens in localStorage exposes them to XSS attacks. The refreshToken
// is managed entirely by the backend as an httpOnly cookie.
// ---------------------------------------------------------------------------
let inMemoryAccessToken: string | null = null;

export const setInMemoryAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getInMemoryAccessToken = (): string | null => inMemoryAccessToken;

// Callback registered by AuthProvider so the axios interceptor can trigger
// a token refresh without importing React context (which would create a circular dep).
let refreshAccessTokenCallback: (() => Promise<string | null>) | null = null;

// Registers the refresh callback. Called once by AuthProvider on mount.
export const setRefreshTokenCallback = (callback: () => Promise<string | null>) => {
  refreshAccessTokenCallback = callback;
};

let isRefreshing = false;
// Queued requests that arrived while a token refresh was in progress.
// They receive the new token (or null on failure) once the refresh settles.
let refreshSubscribers: Array<(token: string | null) => void> = [];
let isRedirecting = false; // Prevents multiple simultaneous redirects to /login

function onRefreshed(token: string | null): void {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string | null) => void): void {
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

// Endpoints that must NOT carry an Authorization header.
// Sending a token on /refresh would cause the backend to reject the request
// since the token may already be expired.
// NOTE: these must match the path passed to apiClient methods (e.g. '/auth/login'),
// NOT the full URL. Axios config.url is the relative path only, not baseURL + path.
const UNAUTHENTICATED_PATHS = ['/auth/refresh', '/auth/login', '/auth/register'];

// Request interceptor - attach Authorization header with accessToken
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip auth header for unauthenticated endpoints (login, register, token refresh)
    const url = config.url || '';
    const isUnauthenticated = UNAUTHENTICATED_PATHS.some(path => url.includes(path));

    if (!isUnauthenticated) {
      // Read access token from memory only — never from localStorage or cookies
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
      // Never retry token-refresh or login requests — avoids infinite refresh loops
      const requestUrl = originalRequest.url || '';
      const isAuthEndpoint = UNAUTHENTICATED_PATHS.some(path => requestUrl.includes(path));
      if (isAuthEndpoint) {
        logger.log('[API Client] Auth endpoint returned 401, not retrying');
        return Promise.reject(error);
      }

      // Guard against infinite retry: only attempt one refresh per original request
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
            // Signal failure to all queued requests so they reject instead of hanging
            onRefreshed(null);
            
            logger.error('[API Client] Token refresh failed, logout initiated');
            
            // Redirect to /login if not already there
            if (!isRedirecting && !window.location.pathname.includes('/login')) {
              isRedirecting = true;
              setTimeout(() => {
                isRedirecting = false;
                window.location.href = '/login';
              }, 100);
            }
            
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Exception during refresh
          isRefreshing = false;
          // Signal failure to all queued requests so they reject instead of hanging
          onRefreshed(null);
          
          logger.error('[API Client] Exception during token refresh', refreshError);
          
          // Redirect to /login
          if (!isRedirecting && !window.location.pathname.includes('/login')) {
            isRedirecting = true;
            setTimeout(() => {
              isRedirecting = false;
              window.location.href = '/login';
            }, 100);
          }
          
          return Promise.reject(refreshError);
        }
      }

      // If a refresh is already in progress, wait for it
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((token: string | null) => {
          if (!token) return reject(new Error('Session expired'));
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    // Rate limit — show a global toast and let the caller decide further UI changes
    if (error.response?.status === 429) {
      getGlobalToastFn()?.('Too many attempts. Please wait a minute and try again.', 'error');
    }

    // Forbidden — show a consistent toast for all 403 responses
    if (error.response?.status === 403) {
      getGlobalToastFn()?.(`You don't have permission to perform this action.`, 'error');
    }

    // Not a 401/429/403 error (or already handled above), reject normally
    return Promise.reject(error);
  }
);


export default apiClient;
