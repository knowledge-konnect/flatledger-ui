import { adminClient } from './adminClient';
import type {
  ApiResponse,
  PagedResult,
  PlatformSettingDto,
  PlatformSettingUpsertRequest,
  SettingListParams,
} from '../types/adminTypes';

export const adminSettingsApi = {
  list: (params: SettingListParams) =>
    adminClient.get<ApiResponse<PagedResult<PlatformSettingDto>>>(
      '/api/admin/settings',
      { params },
    ),

  getByKey: (key: string) =>
    adminClient.get<ApiResponse<PlatformSettingDto>>(
      `/api/admin/settings/${key}`,
    ),

  upsert: (body: PlatformSettingUpsertRequest) =>
    adminClient.put<ApiResponse<PlatformSettingDto>>(
      '/api/admin/settings',
      body,
    ),

  delete: (key: string) =>
    adminClient.delete<ApiResponse<string>>(`/api/admin/settings/${key}`),
};
