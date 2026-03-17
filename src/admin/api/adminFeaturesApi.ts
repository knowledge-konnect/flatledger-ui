import { adminClient } from './adminClient';
import type {
  ApiResponse,
  PagedResult,
  FeatureFlagDto,
  FeatureFlagCreateRequest,
  FeatureFlagUpdateRequest,
  FeatureListParams,
} from '../types/adminTypes';

export const adminFeaturesApi = {
  list: (params: FeatureListParams) =>
    adminClient.get<ApiResponse<PagedResult<FeatureFlagDto>>>(
      '/api/admin/features',
      { params },
    ),

  get: (id: number) =>
    adminClient.get<ApiResponse<FeatureFlagDto>>(`/api/admin/features/${id}`),

  create: (body: FeatureFlagCreateRequest) =>
    adminClient.post<ApiResponse<FeatureFlagDto>>('/api/admin/features', body),

  update: (id: number, body: FeatureFlagUpdateRequest) =>
    adminClient.put<ApiResponse<FeatureFlagDto>>(
      `/api/admin/features/${id}`,
      body,
    ),

  delete: (id: number) =>
    adminClient.delete<ApiResponse<string>>(`/api/admin/features/${id}`),
};
