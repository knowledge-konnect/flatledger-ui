import { adminClient } from './adminClient';
import type {
  ApiResponse,
  PagedResult,
  AdminPlanDto,
  AdminPlanCreateRequest,
  AdminPlanUpdateRequest,
  PlanListParams,
} from '../types/adminTypes';

export const adminPlansApi = {
  list: (params: PlanListParams) =>
    adminClient.get<ApiResponse<PagedResult<AdminPlanDto>>>(
      '/api/admin/plans',
      { params },
    ),

  get: (id: string) =>
    adminClient.get<ApiResponse<AdminPlanDto>>(`/api/admin/plans/${id}`),

  create: (body: AdminPlanCreateRequest) =>
    adminClient.post<ApiResponse<AdminPlanDto>>('/api/admin/plans', body),

  update: (id: string, body: AdminPlanUpdateRequest) =>
    adminClient.put<ApiResponse<AdminPlanDto>>(`/api/admin/plans/${id}`, body),

  delete: (id: string) =>
    adminClient.delete<ApiResponse<string>>(`/api/admin/plans/${id}`),
};
