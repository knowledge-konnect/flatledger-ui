import React, { createContext, useContext, useRef, useState, useMemo, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/authApi';
import { subscriptionApi } from '../api/subscriptionApi';
import { AuthState, LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth';
import { handleApiError, setRefreshTokenCallback, setInMemoryAccessToken } from '../api/client';
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

// sessionStorage keys — survives F5/page-refresh but is cleared when the tab closes
const SS_TOKEN_KEY = '__sl_at';
const SS_USER_KEY  = '__sl_u';

// Try to synchronously restore auth state from sessionStorage.
// Returns a valid AuthState if a non-expired token is found, otherwise null.
function tryRestoreFromSession(): AuthState | null {
  try {
    const token = sessionStorage.getItem(SS_TOKEN_KEY);
    const userJson = sessionStorage.getItem(SS_USER_KEY);
    if (!token || !userJson) return null;

    // Validate expiry (with a 30-second safety buffer)
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp || decoded.exp * 1000 < Date.now() + 30_000) {
      sessionStorage.removeItem(SS_TOKEN_KEY);
      sessionStorage.removeItem(SS_USER_KEY);
      return null;
    }

    const user: User = JSON.parse(userJson);
    // Immediately set the in-memory token so axios interceptors are ready
    setInMemoryAccessToken(token);
    logger.log('[AuthProvider] Session restored from sessionStorage for:', user.email);
    return { user, accessToken: token, isAuthenticated: true, isLoading: false };
  } catch {
    return null;
  }
}

// Initialize auth state — no tokens are stored in localStorage.
// On page refresh we first try sessionStorage; if that fails we fall back to
// a silent httpOnly-cookie refresh from the server.
function getInitialAuthState(): AuthState {
  // Clean up any legacy localStorage keys from before the httpOnly cookie migration
  const legacyKeys = ['accessToken', 'refreshToken', 'authResponse', 'user', 'userTimestamp', 'societyId', 'societyPublicId', 'auth_token'];
  legacyKeys.forEach(key => localStorage.removeItem(key));

  // Fast path: restore from sessionStorage (survives F5 within the same tab)
  const sessionState = tryRestoreFromSession();
  if (sessionState) return sessionState;

  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true, // Will attempt to restore session via the httpOnly cookie refresh
  };
}

// Helper to clear all auth-related data
function clearAllAuthData() {
  // Clear the in-memory access token (refreshToken cookie is cleared by the backend on /auth/revoke)
  setInMemoryAccessToken(null);
  // Clear sessionStorage session
  sessionStorage.removeItem(SS_TOKEN_KEY);
  sessionStorage.removeItem(SS_USER_KEY);
  // Purge any legacy localStorage / sessionStorage keys from older app versions
  const legacyKeys = ['accessToken', 'refreshToken', 'authResponse', 'user', 'userTimestamp', 'societyId', 'societyPublicId', 'auth_token', '__rt'];
  legacyKeys.forEach(key => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
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

  const setAuthState = (token: string | null, authResponse?: AuthResponse) => {
    logger.log(`[AuthProvider] Setting auth state - token present: ${!!token}`);
    
    if (token) {
      const user = decodeJwtToken(token, authResponse);
      
      if (user) {
        // Store access token in memory only — never in localStorage
        setInMemoryAccessToken(token);
        // Persist token + user to sessionStorage so F5 page-refresh restores state instantly
        try {
          sessionStorage.setItem(SS_TOKEN_KEY, token);
          sessionStorage.setItem(SS_USER_KEY, JSON.stringify(user));
        } catch { /* sessionStorage unavailable — silently skip */ }
        // refreshToken is managed exclusively by the backend as an httpOnly cookie
        
        const newState: AuthState = {
          user,
          accessToken: token,
          isAuthenticated: true,
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
      setAuthState(auth.accessToken, auth);
      logger.log(`[AuthProvider.login] Login successful with user data`);
      
      // Return auth response for caller to check forcePasswordChange
      return auth;
    } catch (error) {
      logger.error(`[AuthProvider.login] Login failed`, error);
      setAuthState(null);
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
      setAuthState(auth.accessToken, auth);
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
      setAuthState(null);
      throw handleApiError(error);
    }
  };

  const logout = async () => {
    logger.log(`[AuthProvider.logout] Starting logout`);
    
    // Clear in-memory access token and React state immediately
    setAuthState(null);
    
    // Clear React Query cache
    queryClient.clear();
    logger.log(`[AuthProvider.logout] React Query cache cleared`);
    
    try {
      // Notify server to revoke the refreshToken httpOnly cookie
      await authApi.logout();
      logger.log(`[AuthProvider.logout] Server logout successful`);
    } catch (error) {
      // Logout failed on server, but local state is already cleared
      logger.warn(`[AuthProvider.logout] Server logout failed (local state already cleared)`, error);
    }
    
    // Redirect to /login
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
      refreshAttempts.current = 0;
      await logout();
      return null;
    }

    try {
      isRefreshing.current = true;
      refreshAttempts.current++;
      
      logger.log(`[AuthProvider.refreshAccessToken] Attempting to refresh token (attempt ${refreshAttempts.current}/${MAX_REFRESH_ATTEMPTS})`);
      
      // POST /auth/refresh — no body, refreshToken sent automatically via httpOnly cookie
      const authResponse = await authApi.refresh();
      
      // Update in-memory state with new access token + rotate refresh token
      setAuthState(authResponse.accessToken, authResponse);
      
      refreshAttempts.current = 0;
      logger.log(`[AuthProvider.refreshAccessToken] Token refresh successful`);
      return authResponse.accessToken;
    } catch (error) {
      logger.error(`[AuthProvider.refreshAccessToken] Token refresh failed`, error);
      await logout();
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // Public routes where we skip the silent refresh attempt (no cookie exists yet)
  const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

  // Use useLayoutEffect for synchronous initialization to prevent flickering
  useLayoutEffect(() => {
    const initAuth = async () => {
      // Skip if we just logged in/registered — we already have a fresh token in memory
      if (skipInitialFetch.current) {
        logger.log(`[AuthProvider.initAuth] Skipping init - just logged in/registered`);
        skipInitialFetch.current = false;
        return;
      }

      // Skip on public routes — no session cookie exists yet, refresh will always 401
      const currentPath = window.location.pathname;
      const isPublicRoute = PUBLIC_ROUTES.some(route =>
        route === currentPath || currentPath.startsWith(route + '/')
      );
      if (isPublicRoute) {
        logger.log(`[AuthProvider.initAuth] Skipping init on public route: ${currentPath}`);
        setAuthState(null); // isLoading → false
        return;
      }

      logger.log(`[AuthProvider.initAuth] Attempting silent session restore via httpOnly cookie`);

      try {
        // POST /auth/refresh — browser sends the httpOnly refreshToken cookie automatically
        const authResponse = await authApi.refresh();
        // Pass full authResponse so societyName, userName, role are populated on page reload
        setAuthState(authResponse.accessToken, authResponse);
        logger.log(`[AuthProvider.initAuth] Session restored successfully`);
      } catch (error) {
        logger.log(`[AuthProvider.initAuth] Cookie refresh failed, checking sessionStorage fallback`);
        // If sessionStorage still has a valid (non-expired) token, keep the user logged in.
        // The silent refresh failing doesn't necessarily mean the session is invalid —
        // it could be a temporary network issue or a missing cookie in dev environments.
        const sessionFallback = tryRestoreFromSession();
        if (!sessionFallback) {
          // No valid fallback — the session is truly gone
          setAuthState(null);
        } else {
          logger.log(`[AuthProvider.initAuth] Kept session from sessionStorage fallback`);
        }
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
