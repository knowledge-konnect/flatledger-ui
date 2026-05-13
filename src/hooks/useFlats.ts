import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flatsApi, FlatDto, CreateFlatDto, UpdateFlatDto, FlatStatusDto, FlatFinancialSummaryDto, FlatLedgerDto, BulkCreateFlatsPayload, BulkCreateFlatsResponse } from '../api/flatsApi';
import { logger } from '../lib/logger';

/**
 * Hook: useFlats
 * Purpose: Fetches all flats registered under the current society.
 * Handles legacy 404 responses gracefully — the API now returns an empty array
 * for societies with no flats, but older backend versions may still return 404.
 */
export function useFlats() {
  return useQuery({
    queryKey: ['flats'],
    staleTime: 60_000, // Flat list changes only on CRUD; mutations invalidate this cache
    queryFn: async (): Promise<FlatDto[]> => {
      try {
        const result = await flatsApi.listBySociety();
        return result;
      } catch (err: any) {
        // Guard against legacy 404 responses during the API transition period.
        // New API returns 200 + empty array; old API returned 404 for empty societies.
        if (err?.response?.status === 404) {
          logger.log('[useFlats] 404 treated as empty flats list');
          return [];
        }
        throw err;
      }
    },
  });
}

export function useCreateFlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateFlatDto) => {
      return flatsApi.createFlat(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flats'] });
    }
  });
}

export function useUpdateFlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateFlatDto) => {
      return flatsApi.updateFlat(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flats'] });
    }
  });
}

export function useDeleteFlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (publicId: string) => {
      return flatsApi.deleteFlat(publicId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flats'] });
    }
  });
}

/**
 * Hook: useBulkCreateFlats
 * Purpose: Creates multiple flats in a single API call (e.g. from CSV import).
 * Uses onSettled (instead of onSuccess) to ensure the flats list is refreshed
 * even if the bulk operation partially fails.
 */
export function useBulkCreateFlats() {
  const qc = useQueryClient();
  return useMutation<BulkCreateFlatsResponse, Error, BulkCreateFlatsPayload>({
    mutationFn: async (payload: BulkCreateFlatsPayload) => {
      return flatsApi.bulkCreateFlats(payload);
    },
    onSettled: () => {
      // Refresh regardless of partial success/failure so the list stays accurate
      qc.invalidateQueries({ queryKey: ['flats'] });
    },
  });
}

export function useFlatStatuses() {
  return useQuery({
    queryKey: ['flat-statuses'],
    staleTime: Infinity, // Status enum is static — never changes at runtime
    queryFn: async (): Promise<FlatStatusDto[]> => {
      return flatsApi.getStatuses();
    }
  });
}

/**
 * Hook: useFlatFinancialSummary
 * Purpose: Fetches the financial summary for a single flat (outstanding balance,
 * opening balance remaining, bill outstanding). Used in the payment modal to
 * show accurate figures before recording a payment.
 *
 * staleTime: 0 — figures must be fresh since they directly influence payment amounts.
 */
export function useFlatFinancialSummary(publicId?: string) {
  return useQuery({
    queryKey: ['flat-financial-summary', publicId],
    queryFn: async (): Promise<FlatFinancialSummaryDto> => {
      if (!publicId) {
        throw new Error('Flat public ID is required');
      }
      const result = await flatsApi.getFinancialSummary(publicId);
      return result;
    },
    enabled: !!publicId,
    staleTime: 0, // Always fresh — used in payment modal where accurate figures are critical
  });
}

/**
 * Hook: useFlatLedger
 * Purpose: Fetches the full billing ledger for a flat, including all bills
 * and their payment status. Used in the MaintenanceLedger page.
 */
export function useFlatLedger(publicId?: string) {
  return useQuery({
    queryKey: ['flat-ledger', publicId],
    queryFn: async (): Promise<FlatLedgerDto> => {
      if (!publicId) {
        throw new Error('Flat public ID is required');
      }
      const result = await flatsApi.getLedger(publicId);
      return result;
    },
    enabled: !!publicId,
  });
}
