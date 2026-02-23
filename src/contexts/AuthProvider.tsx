import React, { createContext, useContext, useRef, useState, useMemo, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/authApi';
import { subscriptionApi } from '../api/subscriptionApi';
import { AuthState, LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth';
import { handleApiError, setRefreshTokenCallback } from '../api/client';
import { logger } from '../lib/logger';

// JWT payload structure
interface JwtPayload {
  sub?: string; // userId
  userId?: string;
  societyId?: string;
  societyPublicId?: string;
  role?: string;
  roles?: string[];
  email?: string;
  name?: string;
  userName?: string; // Backend may use userName instead of name
  exp?: number;
  iat?: number;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT and extract user information
// Optionally merge with full AuthResponse data for additional fields
function decodeJwtToken(token: string, authResponse?: AuthResponse): User | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const user: User = {
      publicId: authResponse?.userPublicId || decoded.sub || decoded.userId || '',
      id: decoded.userId || decoded.sub || '',
      email: authResponse?.email || decoded.email || '',
      // Use userName from authResponse first (backend provides this), then fall back to JWT
      name: authResponse?.userName || decoded.userName || decoded.name || '',
      userName: authResponse?.userName || decoded.userName || decoded.name || '',
      role: authResponse?.role || decoded.role || '',
      roles: authResponse?.roles || decoded.roles || (decoded.role ? [decoded.role] : []),
      societyId: decoded.societyId || '',
      societyPublicId: authResponse?.societyPublicId || decoded.societyPublicId || decoded.societyId || '',
      societyName: authResponse?.societyName || null,
      forcePasswordChange: authResponse?.forcePasswordChange ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    logger.log('[AuthProvider.decodeJwtToken] Final user object:', {
      publicId: user.publicId,
      name: user.name,
      email: user.email,
      role: user.role,
      societyName: user.societyName,
    });
    
    return user;
  } catch (error) {
    logger.error('[AuthProvider] Failed to decode JWT token:', error);
    return null;
  }
}

// Initialize auth state from refreshToken (try to get new accessToken)
function getInitialAuthState(): AuthState {
  // Clean up legacy keys from localStorage
  const legacyKeys = ['user', 'userTimestamp', 'societyId', 'societyPublicId', 'auth_token'];
  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });
  
  // Check if there's an accessToken in localStorage (could have been set by axios interceptor during refresh)
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    // Try to restore authResponse data from localStorage for complete user info
    let authResponse: AuthResponse | undefined;
    const storedAuthResponse = localStorage.getItem('authResponse');
    if (storedAuthResponse) {
      try {
        authResponse = JSON.parse(storedAuthResponse);
      } catch (e) {
        logger.warn('[AuthProvider.getInitialAuthState] Failed to parse stored authResponse');
      }
    }
    
    // Decode JWT to get user info, merged with stored authResponse
    const user = decodeJwtToken(accessToken, authResponse);
    if (user) {
      // Valid accessToken found - use it immediately (no loading state needed)
      return {
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    } else {
      // Failed to decode - remove invalid token
      localStorage.removeItem('accessToken');
    }
  }
  
  const refreshToken = localStorage.getItem('refreshToken');
  
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: !!refreshToken, // If refreshToken exists, try to get new accessToken
  };
}

// Helper to clear all auth-related data
function clearAllAuthData() {
  // Remove both accessToken and refreshToken from localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Clean up authResponse data
  localStorage.removeItem('authResponse');
  
  // Clean up any legacy keys
  localStorage.removeItem('user');
  localStorage.removeItem('userTimestamp');
  localStorage.removeItem('societyId');
  localStorage.removeItem('societyPublicId');
  localStorage.removeItem('auth_token');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(getInitialAuthState);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Flag to track if we just logged in/registered (to prevent unnecessary API call)
  const skipInitialFetch = useRef(false);
  
  // Track refresh attempts to prevent infinite loops
  const isRefreshing = useRef(false);
  const refreshAttempts = useRef(0);
  const MAX_REFRESH_ATTEMPTS = 3;

  const setAuthState = (token: string | null, refreshToken?: string | null, authResponse?: AuthResponse) => {
    logger.log(`[AuthProvider] Setting auth state - token present: ${!!token}`);
    
    if (token) {
      // Decode JWT and merge with authResponse if available
      const user = decodeJwtToken(token, authResponse);
      
      if (user) {
        // Store tokens in localStorage for axios interceptor to use
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        // Store authResponse data in localStorage for persistence across page refreshes
        // This ensures userName, societyName, and role persists when page reloads
        if (authResponse) {
          localStorage.setItem('authResponse', JSON.stringify({
            userName: authResponse.userName,
            role: authResponse.role,
            societyName: authResponse.societyName,
            userPublicId: authResponse.userPublicId,
            societyPublicId: authResponse.societyPublicId,
          }));
        }
        
        // Update state with accessToken in memory and decoded user
        const newState: AuthState = {
          user,
          accessToken: token,
          isAuthenticated: true, // Based on accessToken presence
          isLoading: false,
        };
        
        setState(newState);
        logger.log(`[AuthProvider] Authentication successful for user:`, {
          name: user.name,
          userName: user.userName,
          email: user.email,
          role: user.role,
          societyName: user.societyName,
          publicId: user.publicId,
        });
      } else {
        // Failed to decode token, clear everything
        logger.error(`[AuthProvider] Failed to decode token, clearing auth state`);
        clearAllAuthData();
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      // Clear all auth-related data when logging out
      clearAllAuthData();
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      logger.log(`[AuthProvider.login] Starting login for user: ${credentials.usernameOrEmail}`);
      const { auth } = await authApi.login(credentials);
      
      logger.log(`[AuthProvider.login] Login response received:`, {
        userName: auth.userName,
        role: auth.role,
        societyName: auth.societyName,
        userPublicId: auth.userPublicId,
      });
      
      // Set skipInitialFetch to true since we just got fresh user data
      skipInitialFetch.current = true;
      
      // Decode JWT and set auth state with full auth response data
      setAuthState(auth.accessToken, auth.refreshToken, auth);
      logger.log(`[AuthProvider.login] Login successful with user data`);
      
      // Return auth response for caller to check forcePasswordChange
      return auth;
    } catch (error) {
      logger.error(`[AuthProvider.login] Login failed`, error);
      setAuthState(null, null);
      throw handleApiError(error);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      logger.log(`[AuthProvider.register] Starting registration for user: ${credentials.name}`);
      const { auth } = await authApi.register(credentials);
      
      // Set skipInitialFetch to true since we just got fresh user data
      skipInitialFetch.current = true;
      
      // Decode JWT and set auth state with full auth response data
      setAuthState(auth.accessToken, auth.refreshToken, auth);
      logger.log(`[AuthProvider.register] Registration successful with user data`);

      // Automatically create trial subscription for new users
      try {
        const trialResult = await subscriptionApi.createTrial();
        if (trialResult) {
          logger.log(`[AuthProvider.register] Trial subscription created`);
        }
      } catch (error) {
        // Don't fail registration if trial creation fails
        logger.warn(`[AuthProvider.register] Trial creation failed`, error);
      }
      
      // Return auth response for caller to check if tokens are present
      return auth;
    } catch (error) {
      logger.error(`[AuthProvider.register] Registration failed`, error);
      setAuthState(null, null);
      throw handleApiError(error);
    }
  };

  const logout = async () => {
    // Capture refreshToken before clearing state
    const refreshToken = localStorage.getItem('refreshToken');
    
    logger.log(`[AuthProvider.logout] Starting logout`);
    
    // 1. Clear accessToken state
    // 2. Remove refreshToken from localStorage
    // 3. Clear user state
    // This is done via setAuthState(null, null) which calls clearAllAuthData()
    setAuthState(null, null);
    
    // 4. Clear React Query cache - ensure no stale data remains
    queryClient.clear();
    logger.log(`[AuthProvider.logout] React Query cache cleared`);
    
    try {
      // Attempt to notify server of logout (this may fail if token is invalid)
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
      logger.log(`[AuthProvider.logout] Server logout successful`);
    } catch (error) {
      // Logout failed on server, but local state is already cleared
      logger.warn(`[AuthProvider.logout] Server logout failed (local state already cleared)`, error);
    }
    
    // 5. Redirect to /login
    navigate('/login');
    logger.log(`[AuthProvider.logout] Redirected to /login`);
  };

  const updateUser = (updates: Partial<User>) => {
    if (state.user && state.accessToken) {
      const updatedUser = { ...state.user, ...updates };
      // Update state directly since user info is derived from JWT
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    }
  };

  /**
   * Refresh the access token using the refresh token from localStorage
   * Returns new accessToken or null on failure
   * Prevents infinite refresh attempts
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Prevent concurrent refresh attempts
    if (isRefreshing.current) {
      logger.log(`[AuthProvider.refreshAccessToken] Refresh already in progress, skipping`);
      return null;
    }

    // Check for max refresh attempts
    if (refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
      logger.error(`[AuthProvider.refreshAccessToken] Max refresh attempts (${MAX_REFRESH_ATTEMPTS}) exceeded`);
      refreshAttempts.current = 0; // Reset counter
      await logout();
      return null;
    }

    // Read refreshToken from localStorage
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logger.log(`[AuthProvider.refreshAccessToken] No refreshToken found in localStorage`);
      return null;
    }

    try {
      isRefreshing.current = true;
      refreshAttempts.current++;
      
      logger.log(`[AuthProvider.refreshAccessToken] Attempting to refresh token (attempt ${refreshAttempts.current}/${MAX_REFRESH_ATTEMPTS})`);
      
      // Call POST /api/auth/refresh
      const authResponse = await authApi.refresh(refreshToken);
      
      // Success - update accessToken state and refreshToken in localStorage
      setAuthState(authResponse.accessToken, authResponse.refreshToken);
      
      // Reset refresh attempts counter on success
      refreshAttempts.current = 0;
      
      logger.log(`[AuthProvider.refreshAccessToken] Token refresh successful`);
      
      return authResponse.accessToken;
    } catch (error) {
      logger.error(`[AuthProvider.refreshAccessToken] Token refresh failed`, error);
      
      // Refresh failed - logout user
      await logout();
      
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, []); // Empty deps - function uses refs and stable functions

  // Use useLayoutEffect for synchronous initialization to prevent flickering
  useLayoutEffect(() => {
    const initAuth = async () => {
      // Check if we just logged in/registered - skip refresh if so
      if (skipInitialFetch.current) {
        logger.log(`[AuthProvider.initAuth] Skipping init - just logged in/registered`);
        skipInitialFetch.current = false;
        return;
      }

      const refreshToken = localStorage.getItem('refreshToken');
      logger.log(`[AuthProvider.initAuth] Initializing auth - refreshToken present: ${!!refreshToken}`);
      
      if (!refreshToken) {
        logger.log(`[AuthProvider.initAuth] No refreshToken found, clearing auth state`);
        // Ensure state is fully cleared
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      try {
        // Try to get a new accessToken using the refreshToken
        logger.log(`[AuthProvider.initAuth] Attempting to refresh accessToken`);
        const authResponse = await authApi.refresh(refreshToken);
        
        // Set auth state with new accessToken (will decode JWT and store new refreshToken)
        setAuthState(authResponse.accessToken, authResponse.refreshToken);
        logger.log(`[AuthProvider.initAuth] Successfully refreshed accessToken`);
      } catch (error) {
        logger.warn(`[AuthProvider.initAuth] Token refresh failed, clearing auth state`, error);
        // Refresh failed - clear everything
        setAuthState(null, null);
      }
    };

    initAuth();
  }, []); // Empty dependency array - only run once on mount

  // Register refreshAccessToken with axios client on mount
  useLayoutEffect(() => {
    setRefreshTokenCallback(refreshAccessToken);
    logger.log('[AuthProvider] Registered refreshAccessToken callback with axios client');
  }, [refreshAccessToken]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateUser,
      refreshAccessToken,
    }),
    [state] // Only recreate when state actually changes
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
