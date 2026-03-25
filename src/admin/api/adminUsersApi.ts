import { adminClient } from './adminClient';
import type {
  ApiResponse,
  PagedResult,
  AdminUserDto,
  UserListParams,
} from '../types/adminTypes';

export const adminUsersApi = {
  list: (params: UserListParams) =>
    adminClient.get<ApiResponse<PagedResult<AdminUserDto>>>(
      '/api/admin/users',
      { params },
    ),

  get: (id: number | string) =>
    adminClient.get<ApiResponse<AdminUserDto>>(`/api/admin/users/${id}`),
};
