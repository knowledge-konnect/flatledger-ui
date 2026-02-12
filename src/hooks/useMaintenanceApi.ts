import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  maintenanceApi, 
  MaintenancePaymentDto, 
  CreateMaintenancePaymentDto, 
  UpdateMaintenancePaymentDto,
  PaymentModeDto 
} from '../api/maintenanceApi';
import { logger } from '../lib/logger';

export function useMaintenancePayments(societyId?: number) {
  return useQuery({
    queryKey: ['maintenance-payments', societyId],
    queryFn: async (): Promise<MaintenancePaymentDto[]> => {
      if (!societyId) return [];
      logger.log(`[useMaintenancePayments] Fetching maintenance payments for societyId: ${societyId}`);
      const result = await maintenanceApi.listBySociety();
      logger.log(`[useMaintenancePayments] Loaded ${result.length} maintenance payments`);
      return result;
    },
    enabled: !!societyId,
  });
}

export function useCreateMaintenancePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMaintenancePaymentDto) => {
      return maintenanceApi.createPayment(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
    }
  });
}

export function useUpdateMaintenancePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ publicId, payload }: { publicId: string; payload: UpdateMaintenancePaymentDto }) => {
      return maintenanceApi.updatePayment(publicId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
    }
  });
}

export function useDeleteMaintenancePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (publicId: string) => {
      return maintenanceApi.deletePayment(publicId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
    }
  });
}

export function usePaymentModes() {
  return useQuery({
    queryKey: ['payment-modes'],
    queryFn: async (): Promise<PaymentModeDto[]> => {
      logger.log(`[usePaymentModes] Fetching payment modes`);
      const result = await maintenanceApi.getPaymentModes();
      logger.log(`[usePaymentModes] Loaded ${result.length} payment modes`);
      return result;
    }
  });
}
