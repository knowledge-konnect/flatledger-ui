import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  billingApi,
  BillingStatusDto,
  GenerateBillingRequest,
  GenerateBillingResponse,
} from '../api/billingApi';

export function useBillingStatus() {
  return useQuery({
    queryKey: ['billing-status'],
    queryFn: async (): Promise<BillingStatusDto> => {
      return billingApi.getStatus();
    },
  });
}

export function useGenerateBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: GenerateBillingRequest): Promise<GenerateBillingResponse> => {
      return billingApi.generate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
