import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  maintenanceApi, 
  MaintenancePaymentDto, 
  CreateMaintenancePaymentDto, 
  CreateMaintenancePaymentResponse,
  UpdateMaintenancePaymentDto,
  PaymentModeDto,
  MaintenanceSummaryDto
} from '../api/maintenanceApi';
import { createActivityLog } from '../api/activityLogsApi';
import { useAuth } from '../contexts/AuthProvider';
import { logger } from '../lib/logger';

export function useMaintenancePayments() {
  return useQuery({
    queryKey: ['maintenance-payments'],
    queryFn: async (): Promise<MaintenancePaymentDto[]> => {
      logger.log('[useMaintenancePayments] Fetching maintenance payments');
      const result = await maintenanceApi.listBySociety();
      logger.log(`[useMaintenancePayments] Loaded ${result.length} maintenance payments`);
      return result;
    },
  });
}

export function useMaintenanceSummary(period?: string) {
  return useQuery({
    queryKey: ['maintenance-summary', period],
    queryFn: async (): Promise<MaintenanceSummaryDto> => {
      if (!period) {
        throw new Error('Period is required for maintenance summary');
      }
      logger.log(`[useMaintenanceSummary] Fetching summary for period: ${period}`);
      const result = await maintenanceApi.getSummary(period);
      logger.log(`[useMaintenanceSummary] Loaded summary:`, result);
      return result;
    },
    enabled: !!period,
  });
}

export function useCreateMaintenancePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      payload,
      idempotencyKey,
    }: {
      payload: CreateMaintenancePaymentDto;
      idempotencyKey?: string;
    }): Promise<CreateMaintenancePaymentResponse> => {
      return maintenanceApi.createPayment(payload, idempotencyKey);
    },
    onSuccess: async (data, variables) => {
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
      qc.invalidateQueries({ queryKey: ['maintenance-summary'] });
      qc.invalidateQueries({ queryKey: ['flat-ledger', variables.payload.flatPublicId] });
      qc.invalidateQueries({ queryKey: ['flat-financial-summary', variables.payload.flatPublicId] });
      
      // Log activity
      if (user) {
        try {
          await createActivityLog({
            userId: user.id,
            userName: user.name,
            action: 'created',
            entityType: 'payment',
            entityId: variables.payload.flatPublicId,
            entityName: `Flat Payment #${variables.payload.flatPublicId}`,
            amount: data.totalPaid,
            societyId: user.societyId,
            details: `Created maintenance payment of ₹${data.totalPaid} via ${variables.payload.paymentModeId}${
              data.remainingAdvance > 0 ? ` with ₹${data.remainingAdvance} advance` : ''
            }`,
          });
        } catch (error) {
          logger.error('[useCreateMaintenancePayment] Failed to log activity:', error);
        }
      }
    }
  });
}

export function useUpdateMaintenancePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ publicId, payload }: { publicId: string; payload: UpdateMaintenancePaymentDto }) => {
      return maintenanceApi.updatePayment(publicId, payload);
    },
    onSuccess: async (data, variables) => {
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
      qc.invalidateQueries({ queryKey: ['maintenance-summary'] });
      qc.invalidateQueries({ queryKey: ['flat-financial-summary', data.flatPublicId] });
      qc.invalidateQueries({ queryKey: ['flat-ledger', data.flatPublicId] });
      
      // Log activity
      if (user) {
        try {
          await createActivityLog({
            userId: user.id,
            userName: user.name,
            action: 'updated',
            entityType: 'payment',
            entityId: variables.publicId,
            entityName: `Payment #${data.publicId}`,
            amount: data.amount,
            societyId: user.societyId,
            details: `Updated maintenance payment details`,
          });
        } catch (error) {
          logger.error('[useUpdateMaintenancePayment] Failed to log activity:', error);
        }
      }
    }
  });
}

export function useDeleteMaintenancePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (publicId: string) => {
      return maintenanceApi.deletePayment(publicId);
    },
    onSuccess: async (_, publicId) => {
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
      qc.invalidateQueries({ queryKey: ['maintenance-summary'] });
      qc.invalidateQueries({ queryKey: ['flat-financial-summary'] });
      qc.invalidateQueries({ queryKey: ['flat-ledger'] });
      
      // Log activity
      if (user) {
        try {
          await createActivityLog({
            userId: user.id,
            userName: user.name,
            action: 'deleted',
            entityType: 'payment',
            entityId: publicId,
            societyId: user.societyId,
            details: `Deleted maintenance payment`,
          });
        } catch (error) {
          logger.error('[useDeleteMaintenancePayment] Failed to log activity:', error);
        }
      }
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

export function useRestorePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (publicId: string) => {
      logger.log(`[useRestorePayment] Restoring payment: ${publicId}`);
      return maintenanceApi.updatePayment(publicId, {});
    },
    onSuccess: async (data) => {
      logger.log('[useRestorePayment] Success - invalidating payments query');
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
      
      // Log activity
      if (user) {
        try {
          await createActivityLog({
            userId: user.id,
            userName: user.name,
            action: 'updated',
            entityType: 'payment',
            entityId: data.publicId,
            entityName: `Payment of ₹${data.amount}`,
            amount: data.amount,
            societyId: user.societyId,
            details: 'Restored deleted payment',
          });
        } catch (error) {
          logger.error('[useRestorePayment] Failed to log activity:', error);
        }
      }
    },
  });
}
