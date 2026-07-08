import { ApiResponse } from '../types/api';
import apiClient from './client';

export interface UserInvoice {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  amount: number;
  totalAmount: number;
  currency?: string | null;
  status: string;
  dueDate?: string | null;
  paidDate?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  description?: string | null;
  createdAt?: string | null;
}

type ListInvoicesResponse = {
  invoices: UserInvoice[];
};

const getFilenameFromContentDisposition = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const plainMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
};

export const invoiceApi = {
  async getUserInvoices(): Promise<UserInvoice[]> {
    const response = await apiClient.get<ApiResponse<ListInvoicesResponse>>('/invoices');
    if (!response.data?.succeeded) {
      throw new Error(response.data?.message || 'Failed to load invoices');
    }
    return response.data.data?.invoices ?? [];
  },

  async downloadInvoicePdf(invoiceId: string): Promise<{ blob: Blob; fileName: string }> {
    const response = await apiClient.get<Blob>(`/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });

    const fileName = getFilenameFromContentDisposition(response.headers['content-disposition']) ?? `invoice-${invoiceId}.pdf`;
    return { blob: response.data, fileName };
  },
};
