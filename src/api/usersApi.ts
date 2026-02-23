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
  roleDisplayName: string; // Display name: 'Admin', 'Treasurer', 'Member'
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
 */
export interface CreateUserDto {
  name: string; // Required
  email: string; // Required, must be unique
  mobile?: string; // Optional
  roleCode: string; // Required: 'admin', 'treasurer', 'member'
}

/**
 * Create User Response
 * Returns temporary password for new user
 */
export interface CreateUserResponse {
  publicId: string; // UUID
  email: string;
  temporaryPassword: string; // Auto-generated secure password
  message: string;
}

/**
 * Update User Request
 * PUT /users/{publicId}
 * Admin-only operation
 */
export interface UpdateUserDto {
  publicId: string; // UUID - must match path parameter
  name: string;
  email: string;
  mobile?: string;
  roleCode: string; // 'admin', 'treasurer', 'member'
  isActive: boolean;
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
   * Returns temporary password that user must change on first login
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
