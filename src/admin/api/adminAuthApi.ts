import { adminClient } from './adminClient';
import type {
  ApiResponse,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminUser,
} from '../types/adminTypes';

export const adminAuthApi = {
  login: (body: AdminLoginRequest) =>
    adminClient.post<ApiResponse<AdminLoginResponse>>(
      '/api/admin/auth/login',
      body,
    ),

  me: () =>
    adminClient.get<ApiResponse<AdminUser>>('/api/admin/auth/me'),
};
