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

/**
 * Hook: useMaintenancePayments
 * Purpose: Fetches paginated maintenance payments for the current society,
 * optionally filtered by billing period.
 *
 * staleTime: 0 — payments are financial records that must always reflect the
 * latest server state, especially after a create/update/delete mutation.
 */
export function useMaintenancePayments(
  period?: string,
  page = 1,
  pageSize = 50,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['maintenance-payments', period, page, pageSize],
    queryFn: async (): Promise<MaintenancePaymentDto[]> => {
      const result = await maintenanceApi.listBySociety(period, page, pageSize);
      return result;
    },
    staleTime: 0, // Always refetch when period/page changes
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

/**
 * Hook: useMaintenanceSummary
 * Purpose: Fetches aggregated billing stats (total charges, collected, outstanding)
 * for a given YYYY-MM period. Disabled when no period is provided.
 */
export function useMaintenanceSummary(period?: string) {
  return useQuery({
    queryKey: ['maintenance-summary', period],
    queryFn: async (): Promise<MaintenanceSummaryDto> => {
      if (!period) {
        throw new Error('Period is required for maintenance summary');
      }
      const result = await maintenanceApi.getSummary(period);
      return result;
    },
    enabled: !!period,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook: useCreateMaintenancePayment
 * Purpose: Records a new maintenance payment and invalidates all related caches.
 * Supports idempotency keys to prevent duplicate payments on network retries.
 * Also writes an activity log entry for audit trail purposes.
 */
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
      // Invalidate all queries that display payment or financial data
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
      qc.invalidateQueries({ queryKey: ['maintenance-summary'] });
      qc.invalidateQueries({ queryKey: ['flat-ledger', variables.payload.flatPublicId] });
      qc.invalidateQueries({ queryKey: ['flat-financial-summary', variables.payload.flatPublicId] });
      // Invalidate the bulk summary cache so the modal dropdown reflects the new balance on next open
      qc.invalidateQueries({ queryKey: ['flat-financial-summary-bulk'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      
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
          // Activity log failure is non-critical — do not block the UI
          logger.error('[useCreateMaintenancePayment] Failed to log activity:', error);
        }
      }
    }
  });
}

/**
 * Hook: useUpdateMaintenancePayment
 * Purpose: Updates an existing payment record and refreshes all affected caches,
 * including the flat's ledger and financial summary.
 */
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
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      
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

/**
 * Hook: useDeleteMaintenancePayment
 * Purpose: Soft-deletes a payment and invalidates all related caches.
 * Uses broad invalidation (no flatPublicId) since the deleted payment's flat
 * context is not available in the onSuccess callback.
 */
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
      // Broad invalidation — flat context is unavailable after deletion
      qc.invalidateQueries({ queryKey: ['flat-financial-summary'] });
      qc.invalidateQueries({ queryKey: ['flat-ledger'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      
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

/**
 * Hook: usePaymentModes
 * Purpose: Fetches available payment modes (cash, UPI, cheque, NEFT, etc.)
 * for use in payment form dropdowns.
 */
export function usePaymentModes() {
  return useQuery({
    queryKey: ['payment-modes'],
    staleTime: Infinity, // Payment modes (Cash, UPI, etc.) are static reference data
    queryFn: async (): Promise<PaymentModeDto[]> => {
      const result = await maintenanceApi.getPaymentModes();
      return result;
    }
  });
}

/**
 * Hook: useRestorePayment
 * Purpose: Restores a previously soft-deleted payment by sending an empty
 * update payload. The backend interprets this as an undelete operation.
 */
export function useRestorePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (publicId: string) => {
      return maintenanceApi.updatePayment(publicId, {});
    },
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ['maintenance-payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      
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
