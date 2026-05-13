import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  billingApi,
  BillingStatusDto,
  BillingResult,
  GenerateBillingRequest,
  GenerateBillingResponse,
  CatchupBillingRequest,
} from '../api/billingApi';

/**
 * Hook: useBillingStatus
 * Purpose: Fetches the current month's billing generation status.
 * Used by the Dashboard and BillingReminderBanner to determine whether
 * bills have been generated for the current period.
 */
export function useBillingStatus() {
  return useQuery({
    queryKey: ['billing-status'],
    staleTime: 5 * 60_000, // Changes at most once per month; mutations invalidate this cache
    queryFn: async (): Promise<BillingStatusDto> => {
      return billingApi.getStatus();
    },
  });
}

/**
 * Hook: useGenerateBilling
 * Purpose: Triggers manual billing generation for a given period.
 * Invalidates billing-status and dashboard caches on success so the UI
 * reflects the newly generated bills immediately.
 */
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

/**
 * Hook: useTriggerMonthlyJobNow  (SuperAdmin only)
 * Purpose: Immediately runs the scheduled monthly billing job for the current UTC month.
 */
export function useTriggerMonthlyJobNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<BillingResult> => {
      return billingApi.triggerMonthlyJobNow();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook: useCatchupBilling  (SuperAdmin only)
 * Purpose: Triggers catch-up billing for a specific past period across all eligible societies.
 * Defaults to the previous calendar month when no period is provided.
 */
export function useCatchupBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: CatchupBillingRequest): Promise<BillingResult> => {
      return billingApi.catchup(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
