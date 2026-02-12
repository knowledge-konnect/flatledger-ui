import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { subscriptionApi } from '../api/subscriptionApi';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { handleApiError } from '../api/client';
import { logger } from '../lib/logger';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    isAuthenticated: false,
    isLoading: true,
  });

  const setAuthState = (user: User | null, token: string | null) => {
    logger.log(`[AuthProvider] Setting auth state - user: ${user?.name || 'null'}, authenticated: ${!!token}`);
    setState({
      user,
      accessToken: token,
      isAuthenticated: !!user && !!token,
      isLoading: false,
    });

    if (token) {
      localStorage.setItem('accessToken', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        // Also persist societyId separately for legacy code that expects it
        if (user.societyId) {
          try {
            localStorage.setItem('societyId', String(user.societyId));
          } catch {}
        }
      }
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('societyId');
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      logger.log(`[AuthProvider.login] Starting login for user: ${credentials.usernameOrEmail}`);
      const { auth, user } = await authApi.login(credentials);
      setAuthState(user, auth.accessToken);
      logger.log(`[AuthProvider.login] Login successful for user: ${user.name}`);
    } catch (error) {
      logger.error(`[AuthProvider.login] Login failed`, error);
      setAuthState(null, null);
      throw handleApiError(error);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      logger.log(`[AuthProvider.register] Starting registration for user: ${credentials.name}`);
      const { auth, user } = await authApi.register(credentials);
      setAuthState(user, auth.accessToken);
      logger.log(`[AuthProvider.register] Registration successful for user: ${user.name}`);

      // Automatically create trial subscription for new users
      try {
        const trialResult = await subscriptionApi.createTrial();
        if (trialResult.succeeded) {
          logger.log(`[AuthProvider.register] Trial subscription created`);
        } else {
          // Don't fail registration if trial creation fails
          logger.warn(`[AuthProvider.register] Trial creation returned false status`);
        }
      } catch (error) {
        // Don't fail registration if trial creation fails
        logger.warn(`[AuthProvider.register] Trial creation failed`, error);
      }
    } catch (error) {
      logger.error(`[AuthProvider.register] Registration failed`, error);
      setAuthState(null, null);
      throw handleApiError(error);
    }
  };

  const logout = async () => {
    // Clear auth state immediately to prevent any API calls with old token
    logger.log(`[AuthProvider.logout] Starting logout`);
    setAuthState(null, null);
    try {
      // Attempt to notify server of logout (this may fail if token is invalid)
      await authApi.logout();
      logger.log(`[AuthProvider.logout] Logout successful`);
    } catch (error) {
      // Logout failed on server, but local state is already cleared
      logger.warn(`[AuthProvider.logout] Server logout failed (local state already cleared)`, error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...updates };
      setAuthState(updatedUser, state.accessToken);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      logger.log(`[AuthProvider.initAuth] Initializing auth - token present: ${!!token}`);
      
      if (!token) {
        logger.log(`[AuthProvider.initAuth] No token found, skipping auth initialization`);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Always fetch fresh user data from the server to ensure flags like forcePasswordChange are current
        const user = await authApi.getMe();
        setAuthState(user, token);
        logger.log(`[AuthProvider.initAuth] Auth initialized with user: ${user.name}`);
      } catch (error) {
        logger.warn(`[AuthProvider.initAuth] Failed to fetch fresh user data, trying stored user`);
        // If /auth/me fails but token exists, still try to use stored user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            // Use stored user but mark that refresh failed
            setAuthState(user, token);
            logger.log(`[AuthProvider.initAuth] Initialized with stored user data: ${user.name}`);
            return;
          } catch (parseError) {
            // Invalid stored user data
            logger.error(`[AuthProvider.initAuth] Failed to parse stored user data`, parseError);
          }
        }
        // If no valid user data available, clear auth state
        logger.log(`[AuthProvider.initAuth] No valid user data available, clearing auth state`);
        setAuthState(null, null);
      }
    };

    initAuth();
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
