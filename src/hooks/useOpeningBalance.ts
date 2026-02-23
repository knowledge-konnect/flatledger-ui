import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openingBalanceApi } from '../api/openingBalanceApi';
import { OpeningBalanceRequest } from '../types/openingBalance.types';

/**
 * Hook to fetch opening balance status
 * Gracefully handles 404 if backend endpoint not implemented yet
 */
export function useOpeningBalanceStatus() {
  return useQuery({
    queryKey: ['opening-balance-status'],
    queryFn: async () => {
      try {
        return await openingBalanceApi.getStatus();
      } catch (error: any) {
        // If endpoint doesn't exist yet (404), return default state
        if (error?.response?.status === 404) {
          return {
            isApplied: false,
            appliedAt: null,
            appliedBy: null,
          };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (endpoint not implemented)
      if (error?.response?.status === 404) {
        return false;
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
  });
}

/**
 * Hook to submit opening balance
 */
export function useSubmitOpeningBalance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: OpeningBalanceRequest) =>
      openingBalanceApi.submitOpeningBalance(payload),
    onSuccess: () => {
      // Invalidate status to reflect the change
      queryClient.invalidateQueries({ queryKey: ['opening-balance-status'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
    },
  });
}
