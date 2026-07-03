import React, { createContext, useContext, useRef, useState, useMemo, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/authApi';
import { subscriptionApi } from '../api/subscriptionApi';
import { AuthState, LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth';
import { handleApiError as categorizeError } from '../api/errorHandler';
import { setRefreshTokenCallback, setInMemoryAccessToken } from '../api/client';
import { logger } from '../lib/logger';

// AuthContext is created at module scope. Prevent Vite HMR from partially replacing
// this module — doing so would create a new AuthContext whilst lazy-loaded consumers
// (Login, Dashboard…) still hold a reference to the old one, causing the
// "useAuth must be used within an AuthProvider" error. A full page reload is safer.
if (import.meta.hot) {
  import.meta.hot.invalidate();
}

// JWT payload structure
interface JwtPayload {
  sub?: string; // userId
  userId?: string;
  societyId?: string;
  societyPublicId?: string;
  role?: string;
  roles?: string[];
  roleDisplayName?: string;
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

/**
 * Normalizes the roles field from the JWT or API response into a plain string[].
 * The backend may return roles as string[] or as object[]{id, code, displayName}
 * depending on the endpoint version. This ensures consumers always get string[].
 */
function normalizeRoles(roles: unknown): string[] | null {
  if (!Array.isArray(roles) || roles.length === 0) return null;
  return roles.map(r => {
    if (typeof r === 'string') return r;
    if (r && typeof r === 'object') {
      const obj = r as Record<string, unknown>;
      return String(obj.code || obj.name || obj.displayName || '');
    }
    return String(r);
  }).filter(Boolean);
}

/**
 * Decodes a JWT access token and constructs a User object.
 * Merges data from the full AuthResponse (login/register) when available,
 * since the JWT payload may omit fields like societyName and userName that
 * the API response includes.
 */
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
      roles: normalizeRoles(authResponse?.roles) || normalizeRoles(decoded.roles) || (decoded.role ? [decoded.role] : []),
      societyId: decoded.societyId || '',
      societyPublicId: authResponse?.societyPublicId || decoded.societyPublicId || decoded.societyId || '',
      societyName: authResponse?.societyName || null,
      roleDisplayName: authResponse?.roleDisplayName || decoded.roleDisplayName || '',
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

/**
 * Attempts to restore auth state synchronously from sessionStorage.
 * sessionStorage survives page refreshes (F5) but is cleared when the tab closes,
 * making it a good short-lived cache for the access token.
 * Returns a valid AuthState if a non-expired token is found, otherwise null.
 */
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

    // Validate shape before trusting the stored value — guards against stale
    // data from a previous schema version causing a crash on access.
    const parsed: unknown = JSON.parse(userJson);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('publicId' in parsed) ||
      !('role' in parsed)
    ) {
      sessionStorage.removeItem(SS_TOKEN_KEY);
      sessionStorage.removeItem(SS_USER_KEY);
      return null;
    }
    const user = parsed as User;
    // Immediately populate the in-memory token so axios interceptors are ready
    // before any component mounts and fires an API call
    setInMemoryAccessToken(token);
    logger.log('[AuthProvider] Session restored from sessionStorage for:', user.email);
    return { user, accessToken: token, isAuthenticated: true, isLoading: false };
  } catch {
    return null;
  }
}

/**
 * Derives the initial auth state on first render.
 * Priority order:
 * 1. sessionStorage — fast path for page refreshes within the same tab
 * 2. isLoading: true — triggers a silent httpOnly-cookie refresh in useLayoutEffect
 *
 * No tokens are ever stored in localStorage; the refreshToken lives exclusively
 * in an httpOnly cookie managed by the backend.
 */
function getInitialAuthState(): AuthState {
  // Remove any legacy localStorage keys left over from before the httpOnly cookie migration
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

/**
 * Clears all auth-related data from memory and browser storage.
 * The refreshToken httpOnly cookie is cleared server-side via POST /auth/revoke.
 */
function clearAllAuthData() {
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
  const refreshAttempts = useRef(0);
  const MAX_REFRESH_ATTEMPTS = 3;
  // Timer ref for session expiry warning — cleared on logout/re-auth
  const expiryWarningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setAuthState = (token: string | null, authResponse?: AuthResponse, shouldNavigate: boolean = true) => {
    // Clear any pending expiry warning from a previous session
    if (expiryWarningTimer.current) {
      clearTimeout(expiryWarningTimer.current);
      expiryWarningTimer.current = null;
    }

    if (token) {
      const user = decodeJwtToken(token, authResponse);
      
      if (user) {
        setInMemoryAccessToken(token);
        try {
          sessionStorage.setItem(SS_TOKEN_KEY, token);
          sessionStorage.setItem(SS_USER_KEY, JSON.stringify(user));
        } catch { /* sessionStorage unavailable — silently skip */ }
        const newState: AuthState = {
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        };
        setState(newState);

        // Schedule a warning toast 2 minutes before the token expires
        try {
          const decoded = jwtDecode<{ exp?: number }>(token);
          if (decoded.exp) {
            const msUntilExpiry = decoded.exp * 1000 - Date.now();
            const warnAt = msUntilExpiry - 2 * 60 * 1000; // 2 min before expiry
            if (warnAt > 0) {
              expiryWarningTimer.current = setTimeout(() => {
                window.dispatchEvent(new CustomEvent('flatledger:session-expiring'));
              }, warnAt);
            }
          }
        } catch { /* non-critical — skip if JWT decode fails */ }

        logger.log(`[AuthProvider] Authentication successful for user:`, {
          name: user.name,
          userName: user.userName,
          email: user.email,
          role: user.role,
          societyName: user.societyName,
          publicId: user.publicId,
        });
      } else {
        logger.error(`[AuthProvider] Failed to decode token, clearing auth state`);
        clearAllAuthData();
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        if (shouldNavigate) navigate('/login', { replace: true });
      }
    } else {
      clearAllAuthData();
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      if (shouldNavigate) navigate('/login', { replace: true });
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
      queryClient.clear();
      logger.log(`[AuthProvider.login] Login successful with user data`);
      
      // Return auth response for caller to check forcePasswordChange
      return auth;
    } catch (error) {
      logger.error(`[AuthProvider.login] Login failed`, error);
      // Do NOT navigate — the failure is a credential error, not a session expiry.
      // The Login page is already rendered; it will display the error toast in-place.
      setAuthState(null, undefined, false);
      throw categorizeError(error);
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
      // Do NOT navigate — the Signup page handles the error in-place.
      setAuthState(null, undefined, false);
      throw categorizeError(error);
    }
  };

  const logout = async () => {
    logger.log(`[AuthProvider.logout] Starting logout`);

    // Navigate FIRST — before clearing auth state. This ensures the URL is already
    // on a public route (/) when isAuthenticated becomes false, so ProtectedRoute
    // never sees the unauthenticated state on a protected path and cannot redirect to /login.
    navigate('/');
    logger.log(`[AuthProvider.logout] Redirected to /`);

    // Clear in-memory access token and React state (no further navigation — already handled above)
    setAuthState(null, undefined, false);

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
    // Check for max refresh attempts
    if (refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
      logger.error(`[AuthProvider.refreshAccessToken] Max refresh attempts (${MAX_REFRESH_ATTEMPTS}) exceeded`);
      refreshAttempts.current = 0;
      await logout();
      return null;
    }

    try {
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
    }
  }, []);

  // Public routes where we skip the silent refresh attempt (no cookie exists yet)
  const PUBLIC_ROUTES = ['/', '/privacy', '/terms', '/login', '/signup', '/forgot-password', '/reset-password'];

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
        // Do not clear an existing valid session when user lands on a public page
        // (e.g. reset-password, login). Just finish initialization.
        setState(prev => (prev.isLoading ? { ...prev, isLoading: false } : prev));
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
