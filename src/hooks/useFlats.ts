import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flatsApi, FlatDto, CreateFlatDto, UpdateFlatDto, FlatStatusDto, FlatFinancialSummaryDto, FlatLedgerDto } from '../api/flatsApi';
import { logger } from '../lib/logger';

export function useFlats() {
  return useQuery({
    queryKey: ['flats'],
    queryFn: async (): Promise<FlatDto[]> => {
      logger.log('[useFlats] Fetching flats');
      const result = await flatsApi.listBySociety();
      logger.log(`[useFlats] Loaded ${result.length} flats`);
      return result;
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

export function useFlatStatuses() {
  return useQuery({
    queryKey: ['flat-statuses'],
    queryFn: async (): Promise<FlatStatusDto[]> => {
      return flatsApi.getStatuses();
    }
  });
}

export function useFlatFinancialSummary(publicId?: string) {
  return useQuery({
    queryKey: ['flat-financial-summary', publicId],
    queryFn: async (): Promise<FlatFinancialSummaryDto> => {
      if (!publicId) {
        throw new Error('Flat public ID is required');
      }
      logger.log(`[useFlatFinancialSummary] Fetching financial summary for publicId: ${publicId}`);
      const result = await flatsApi.getFinancialSummary(publicId);
      logger.log(`[useFlatFinancialSummary] Loaded summary:`, result);
      return result;
    },
    enabled: !!publicId,
    staleTime: 0, // Always fresh — used in payment modal where accurate figures are critical
  });
}

export function useFlatLedger(publicId?: string) {
  return useQuery({
    queryKey: ['flat-ledger', publicId],
    queryFn: async (): Promise<FlatLedgerDto> => {
      if (!publicId) {
        throw new Error('Flat public ID is required');
      }
      logger.log(`[useFlatLedger] Fetching ledger for publicId: ${publicId}`);
      const result = await flatsApi.getLedger(publicId);
      logger.log(`[useFlatLedger] Loaded ledger with ${result.bills.length} bills`);
      return result;
    },
    enabled: !!publicId,
  });
}
