import { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth';
import { ApiResponse } from '../types/api';
import apiClient from './client';
import { logger } from '../lib/logger';

/**
 * Converts AuthResponse to User object
 * Maps the login response data to User type
 * Backend response includes: accessToken, refreshToken, roles, userName, role, societyName, forcePasswordChange
 */
const authResponseToUser = (response: any): User => {
  // Check multiple possible field names for the force password change flag
  const forcePasswordChange = 
    response.forcePasswordChange || 
    response.force_password_change || 
    response.requirePasswordChange || 
    response.require_password_change || 
    response.mustChangePassword || 
    false;
  
  return {
    id: String(response.userId || response.id || ''),
    name: response.userName || response.name || '', // Backend sends 'userName'
    email: response.email || response.userName || '', // Use userName as fallback
    userName: response.userName,
    role: response.role, // Single role from backend
    roles: Array.isArray(response.roles) ? response.roles : [response.role].filter(Boolean), // Convert to array
    societyId: String(response.societyId || response.society_id || ''),
    societyName: response.societyName || response.society_name, // Society name from backend
    forcePasswordChange: Boolean(forcePasswordChange), // Explicitly convert to boolean
    createdAt: response.createdAt || new Date().toISOString(),
    updatedAt: response.updatedAt || new Date().toISOString(),
  };
};

export const authApi = {
  async login(credentials: LoginCredentials): Promise<{ auth: AuthResponse; user: User }> {
    logger.log(`[authApi.login] Attempting login for user: ${credentials.usernameOrEmail}`);
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const authResponse = response.data.data;
    const user = authResponseToUser(authResponse);
    logger.log(`[authApi.login] Login successful for user: ${user.name}`);
    return {
      auth: authResponse,
      user,
    };
  },

  async register(credentials: RegisterCredentials): Promise<{ auth: AuthResponse; user: User }> {
    logger.log(`[authApi.register] Attempting registration for user: ${credentials.name}`);
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    const authResponse = response.data.data;
    const user = authResponseToUser(authResponse);
    // Enrich user with data from credentials since they were just created
    user.name = credentials.name;
    user.email = credentials.email;
    logger.log(`[authApi.register] Registration successful for user: ${user.name}`);
    return {
      auth: authResponse,
      user,
    };
  },

  async logout(): Promise<void> {
    try {
      logger.log(`[authApi.logout] Attempting logout`);
      await apiClient.post('/auth/logout');
      logger.log(`[authApi.logout] Logout successful`);
    } catch (error) {
      // Even if logout endpoint fails, we still want to clear local state
      // So we don't throw here - let the caller handle the cleanup
      logger.error(`[authApi.logout] Logout endpoint failed`, error);
    }
  },

  async refresh(): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', {}, {
      withCredentials: true
    });
    return response.data.data;
  },

  /**
   * Fetch current user from /auth/user endpoint
   * This ensures we always have the latest user data including societyId and forcePasswordChange flag
   */
  async getMe(): Promise<User> {
    try {
      logger.log(`[authApi.getMe] Fetching current user profile`);
      const response = await apiClient.get<ApiResponse<User>>('/auth/user');
      const user = response.data.data;
      logger.log(`[authApi.getMe] User profile loaded: ${user.name} (societyId: ${user.societyId})`);
      return user;
    } catch (error: any) {
      // If the request failed, re-throw to let caller handle it
      logger.error(`[authApi.getMe] Failed to fetch user profile`, error);
      throw error;
    }
  }
};
