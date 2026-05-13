import { ApiResponse } from '../types/api';
import { unwrapArrayData } from './responseUtils';
import apiClient from './client';

/**
 * User DTO following API documentation
 * All entities use publicId (UUID) as primary identifier
 */
export interface User {
  publicId: string; // UUID - primary identifier
  societyPublicId?: string; // UUID - society identifier
  name: string;
  email: string;
  mobile?: string | null;
  roleDisplayName: string; // Display name: 'Society Admin' | 'Admin' | 'Treasurer' | 'Secretary' | 'Manager' | 'Viewer'
  isActive: boolean;
  forcePasswordChange?: boolean;
  lastLogin?: string | null; // ISO 8601 DateTime
  createdAt: string;
  updatedAt: string;
}

/**
 * Create User Request
 * POST /users
 * Admin-only operation
 * Backend: CreateUserDto(Name, Email?, Username?, Mobile?, RoleCode?, Password [required])
 */
export interface CreateUserDto {
  name: string;
  email?: string;
  username?: string;
  mobile?: string;
  roleCode: string;
  password: string; // Required — admin must set the initial password
}

/**
 * Create User Response
 */
export interface CreateUserResponse {
  publicId: string;
  email: string;
  message: string;
}

/**
 * Update User Request
 * PUT /users/{publicId}
 * Admin-only operation
 * Backend: UpdateUserDto(PublicId, Name, Email [required], Mobile?, RoleCode)
 * Note: isActive cannot be changed via this endpoint — use DELETE to deactivate.
 */
export interface UpdateUserDto {
  publicId: string;
  name: string;
  email: string; // Required by backend
  mobile?: string;
  roleCode: string;
}

/**
 * Users API Service
 * All endpoints require authentication and Admin role
 * Active subscription required
 */
export const usersApi = {
  /**
   * List all users in the authenticated user's society
   * GET /users
   * Requires: Admin role + Active subscription
   * @returns Promise<User[]>
   */
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<unknown>>('/users');
    return unwrapArrayData<User>(response.data.data, 'users');
  },

  /**
   * Get user by public ID
   * GET /users/{publicId}
   * Requires: Admin role + Active subscription
   * @param publicId UUID of the user
   * @returns Promise<User>
   */
  async getUserById(publicId: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${publicId}`);
    return response.data.data;
  },

  /**
   * Create new user in the society
   * POST /users
   * Requires: Admin role + Active subscription
   * @param payload CreateUserDto
   * @returns Promise<CreateUserResponse>
   */
  async createUser(payload: CreateUserDto): Promise<CreateUserResponse> {
    const response = await apiClient.post<ApiResponse<CreateUserResponse>>('/users', payload);
    return response.data.data;
  },

  /**
   * Update existing user details
   * PUT /users/{publicId}
   * Requires: Admin role + Active subscription
   * @param publicId UUID of the user
   * @param payload UpdateUserDto with updated fields
   * @returns Promise<User>
   */
  async updateUser(publicId: string, payload: UpdateUserDto): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${publicId}`, payload);
    return response.data.data;
  },

  /**
   * Delete user (soft delete - sets isActive = false)
   * DELETE /users/{publicId}
   * Requires: Admin role + Active subscription
   * Cannot delete yourself
   * @param publicId UUID of the user
   * @returns Promise<void>
   */
  async deleteUser(publicId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/users/${publicId}`);
  }
};
