import { useQuery } from '@tanstack/react-query';
import { financialsApi, Invoice } from '../api/financialsApi';
import { PaginatedResponse, PaginationParams } from '../types/api';

export const useInvoices = (params?: PaginationParams) => {
  return useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', params],
    queryFn: () => financialsApi.getInvoices(params)
  });
};

export const useInvoice = (id: string) => {
  return useQuery<Invoice>({
    queryKey: ['invoices', id],
    queryFn: () => financialsApi.getInvoiceById(id),
    enabled: !!id
  });
};
