import { adminClient } from './adminClient';
import type {
  ApiResponse,
  PagedResult,
  AdminSocietyDto,
  SocietyListParams,
} from '../types/adminTypes';

export const adminSocietiesApi = {
  list: (params: SocietyListParams) =>
    adminClient.get<ApiResponse<PagedResult<AdminSocietyDto>>>(
      '/api/admin/societies',
      { params },
    ),

  get: (id: number | string) =>
    adminClient.get<ApiResponse<AdminSocietyDto>>(
      `/api/admin/societies/${id}`,
    ),
};
