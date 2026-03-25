import { adminClient } from './adminClient';
import type {
  ApiResponse,
  PagedResult,
  AdminPaymentDto,
  PaymentListParams,
} from '../types/adminTypes';

export const adminPaymentsApi = {
  list: (params: PaymentListParams) =>
    adminClient.get<ApiResponse<PagedResult<AdminPaymentDto>>>(
      '/api/admin/payments',
      { params },
    ),
};
