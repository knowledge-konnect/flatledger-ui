import { adminClient } from './adminClient';
import type {
  ApiResponse,
  PagedResult,
  AdminSubscriptionDto,
  AdminSubscriptionUpdateRequest,
  SubscriptionListParams,
} from '../types/adminTypes';

export const adminSubscriptionsApi = {
  list: (params: SubscriptionListParams) =>
    adminClient.get<ApiResponse<PagedResult<AdminSubscriptionDto>>>(
      '/api/admin/subscriptions',
      { params },
    ),

  get: (id: string) =>
    adminClient.get<ApiResponse<AdminSubscriptionDto>>(
      `/api/admin/subscriptions/${id}`,
    ),

  update: (id: string, body: AdminSubscriptionUpdateRequest) =>
    adminClient.put<ApiResponse<AdminSubscriptionDto>>(
      `/api/admin/subscriptions/${id}`,
      body,
    ),
};
