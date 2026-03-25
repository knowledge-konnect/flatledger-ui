import { adminClient } from './adminClient';
import type {
  ApiResponse,
  PagedResult,
  AdminInvoiceDto,
  InvoiceListParams,
} from '../types/adminTypes';

export const adminInvoicesApi = {
  list: (params: InvoiceListParams) =>
    adminClient.get<ApiResponse<PagedResult<AdminInvoiceDto>>>(
      '/api/admin/invoices',
      { params },
    ),
};
