import { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth';
import { ApiResponse } from '../types/api';
import apiClient from './client';
import { logger } from '../lib/logger';

/**
 * Converts AuthResponse to User object
 * Maps the API response to User type following the actual backend response structure
 * API returns: accessToken, roles, userPublicId, societyPublicId, societyName, userName, role, forcePasswordChange
 * refreshToken is set as an httpOnly cookie by the backend.
 */
const authResponseToUser = (response: any): User => {
  const forcePasswordChange = 
    response.forcePasswordChange || 
    response.force_password_change || 
    response.requirePasswordChange || 
    response.require_password_change || 
    response.mustChangePassword || 
    false;
  
  return {
    publicId: response.userPublicId || response.publicId || '',
    id: String(response.userId || response.userPublicId || response.id || ''),
    name: response.userName || response.name || '',
    email: response.email || '', // Email not in login response, will be enriched from credentials
    userName: response.userName,
    role: response.role || 'member',
    roles: Array.isArray(response.roles) ? response.roles : response.role ? [response.role] : [],
    societyId: String(response.societyId || response.societyPublicId || ''),
    societyPublicId: response.societyPublicId || '',
    societyName: response.societyName || response.society_name,
    forcePasswordChange: Boolean(forcePasswordChange),
    isActive: response.isActive !== undefined ? response.isActive : true,
    mobile: response.mobile || null,
    roleDisplayName: response.roleDisplayName || response.role || 'Member',
    lastLogin: response.lastLogin || null,
    createdAt: response.createdAt || new Date().toISOString(),
    updatedAt: response.updatedAt || new Date().toISOString(),
  };
};

export const authApi = {
  /**
   * Login with username/email and password
   * POST /auth/login
   * Returns: accessToken, roles, userPublicId, societyPublicId, userName, role, forcePasswordChange
   * refreshToken is set as an httpOnly cookie by the backend.
   */
  async login(credentials: LoginCredentials): Promise<{ auth: AuthResponse; user: User }> {
    logger.log(`[authApi.login] Attempting login for user: ${credentials.usernameOrEmail}`);
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Login failed');
    }
    
    const authResponse = response.data.data;
    const user = authResponseToUser(authResponse);
    
    // Enrich user with email from credentials since login response doesn't include it
    if (!user.email && credentials.usernameOrEmail.includes('@')) {
      user.email = credentials.usernameOrEmail;
    }
    
    logger.log(`[authApi.login] Login successful - user: ${user.name}, society: ${user.societyName}`);
    return {
      auth: authResponse,
      user,
    };
  },

  /**
   * Register new user and society
   * POST /auth/register
   * Returns: accessToken, roles, societyPublicId, userName, role, forcePasswordChange
   * refreshToken is set as an httpOnly cookie by the backend.
   */
  async register(credentials: RegisterCredentials): Promise<{ auth: AuthResponse; user: User }> {
    logger.log(`[authApi.register] Attempting registration`);
    
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Registration failed');
    }
    
    const authResponse = response.data.data;
    const user = authResponseToUser(authResponse);
    
    // Enrich user with data from credentials since they were just created
    user.name = credentials.name;
    user.email = credentials.email;
    
    // IMPORTANT: Always use the societyName from credentials since we just created it
    user.societyName = credentials.societyName;
    
    logger.log(`[authApi.register] Registration successful - user: ${user.name}, society: ${user.societyName} (${user.societyPublicId})`);
    return {
      auth: authResponse,
      user,
    };
  },

  /**
   * Logout and revoke refresh token
   * POST /auth/revoke
   * No body — backend reads and clears the refreshToken httpOnly cookie.
   */
  async logout(): Promise<void> {
    try {
      logger.log(`[authApi.logout] Attempting logout`);
      await apiClient.post('/auth/revoke');
      logger.log(`[authApi.logout] Logout successful`);
    } catch (error) {
      logger.error(`[authApi.logout] Logout endpoint failed`, error);
      throw error;
    }
  },

  /**
   * Refresh access token
   * POST /auth/refresh
   * No body — backend reads the refreshToken from the httpOnly cookie,
   * rotates it, sets a new cookie, and returns a new accessToken.
   */
  async refresh(): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Token refresh failed');
    }
    
    return response.data.data;
  },

  /**
   * Fetch current authenticated user details
   * GET /auth/user
   * Requires: Authorization header with access token
   * Returns: User object with all profile details
   */
  async getMe(): Promise<User> {
    try {
      logger.log(`[authApi.getMe] Fetching current user profile`);
      const response = await apiClient.get<ApiResponse<User>>('/auth/user');
      
      if (!response.data.succeeded) {
        throw new Error(response.data.message || 'Failed to fetch user profile');
      }
      
      const userData = response.data.data;
      // Ensure proper structure according to API documentation
      const user: User = {
        publicId: userData.publicId || '',
        id: userData.id || userData.publicId || '',
        name: userData.name || '',
        email: userData.email || '',
        userName: userData.userName,
        role: userData.role || 'member',
        roles: Array.isArray(userData.roles) ? userData.roles : userData.role ? [userData.role] : [],
        societyId: userData.societyId || '',
        societyPublicId: userData.societyPublicId || '',
        societyName: userData.societyName,
        forcePasswordChange: userData.forcePasswordChange || false,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        mobile: userData.mobile || null,
        roleDisplayName: userData.roleDisplayName || userData.role || 'Member',
        lastLogin: userData.lastLogin || null,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      };
      
      logger.log(`[authApi.getMe] User profile loaded: ${user.name} (societyId: ${user.societyId})`);
      return user;
    } catch (error: any) {
      logger.error(`[authApi.getMe] Failed to fetch user profile`, error);
      throw error;
    }
  },

  /**
   * Update own profile (self-service)
   * PATCH /auth/profile
   * Requires: Authorization header (any authenticated user)
   * Body: { mobile?: string }
   */
  async updateProfile(payload: { mobile?: string }): Promise<User> {
    try {
      logger.log(`[authApi.updateProfile] Updating profile`);
      const response = await apiClient.patch<ApiResponse<User>>('/auth/profile', payload);
      if (!response.data.succeeded) {
        throw new Error(response.data.message || 'Failed to update profile');
      }
      logger.log(`[authApi.updateProfile] Profile updated successfully`);
      return response.data.data;
    } catch (error: any) {
      logger.error(`[authApi.updateProfile] Failed to update profile`, error);
      throw error;
    }
  },

  /**
   * Change password for authenticated user
   * POST /auth/change-password
   * Requires: Authorization header with access token
   * Body: { currentPassword: string, newPassword: string }
   */
  async changePassword(currentPassword: string, newPassword: string, confirmPassword?: string): Promise<void> {
    try {
      logger.log(`[authApi.changePassword] Attempting to change password`);
      const response = await apiClient.post<ApiResponse<any>>('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword: confirmPassword ?? newPassword,
      });
      
      if (!response.data.succeeded) {
        throw new Error(response.data.message || 'Failed to change password');
      }
      
      logger.log(`[authApi.changePassword] Password changed successfully`);
    } catch (error: any) {
      logger.error(`[authApi.changePassword] Failed to change password`, error);
      throw error;
    }
  }
};
