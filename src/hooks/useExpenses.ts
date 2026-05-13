import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  expensesApi,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseResponse,
  ExpenseCategory,
} from '../api/expensesApi';
import { createActivityLog } from '../api/activityLogsApi';
import { useAuth } from '../contexts/AuthProvider';
import { logger } from '../lib/logger';

/* =====================================================
   QUERIES
   Expense queries are scoped to the current society via the JWT token.
   The backend enforces society isolation — no explicit societyId is needed.
===================================================== */

/**
 * Hook: useExpenses
 * Purpose: Fetches all expenses for the current society.
 */
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<ExpenseResponse[]> => {
      const result = await expensesApi.listExpenses();
      return result;
    },
  });
}

/**
 * Hook: useExpenseByPublicId
 * Purpose: Fetches a single expense by its public UUID. Disabled when no ID is provided.
 */
export function useExpenseByPublicId(publicId?: string) {
  return useQuery({
    queryKey: ['expenses', publicId],
    queryFn: async (): Promise<ExpenseResponse> => {
      if (!publicId) throw new Error('Public ID is required');
      const result = await expensesApi.getExpenseByPublicId(publicId);
      return result;
    },
    enabled: !!publicId,
  });
}

/**
 * Hook: useExpensesByDateRange
 * Purpose: Fetches expenses within a specific date range. Used in report pages.
 * Disabled until both startDate and endDate are provided.
 */
export function useExpensesByDateRange(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['expenses', 'dateRange', startDate, endDate],
    queryFn: async (): Promise<ExpenseResponse[]> => {
      if (!startDate || !endDate) throw new Error('Start date and end date are required');
      const result = await expensesApi.getExpensesByDateRange(startDate, endDate);
      return result;
    },
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Hook: useExpensesByCategory
 * Purpose: Fetches expenses filtered by category code. Used in the expense breakdown report.
 */
export function useExpensesByCategory(categoryCode?: string) {
  return useQuery({
    queryKey: ['expenses', 'category', categoryCode],
    queryFn: async (): Promise<ExpenseResponse[]> => {
      if (!categoryCode) throw new Error('Category code is required');
      const result = await expensesApi.getExpensesByCategory(categoryCode);
      return result;
    },
    enabled: !!categoryCode,
  });
}

/**
 * Hook: useExpenseCategories
 * Purpose: Fetches the list of available expense categories for form dropdowns.
 */
export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expenses', 'categories'],
    staleTime: 5 * 60_000, // Categories rarely change
    queryFn: async (): Promise<ExpenseCategory[]> => {
      const result = await expensesApi.getCategories();
      return result;
    },
  });
}

/* =====================================================
   MUTATIONS
===================================================== */

/**
 * Hook: useCreateExpense
 * Purpose: Creates a new expense and refreshes the expenses list and dashboard.
 * Also writes an activity log entry for audit trail purposes.
 */
export function useCreateExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: CreateExpenseRequest) => {
      return expensesApi.createExpense(payload);
    },
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (user) {
        try {
          await createActivityLog({
            userId: user.id,
            userName: user.name,
            action: 'created',
            entityType: 'expense',
            entityId: data.publicId,
            entityName: `${data.vendor} - ${data.description}`,
            amount: data.amount,
            societyId: user.societyId,
            details: `Created expense of ₹${data.amount} for ${data.categoryCode}`,
          });
        } catch (error) {
          // Activity log failure is non-critical — do not block the UI
          logger.error('[useCreateExpense] Failed to log activity:', error);
        }
      }
    },
  });
}

/**
 * Hook: useUpdateExpense
 * Purpose: Updates an expense record. Detects status changes (approved/rejected)
 * to write a more descriptive activity log entry.
 */
export function useUpdateExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ publicId, payload }: { publicId: string; payload: UpdateExpenseRequest }) => {
      return expensesApi.updateExpense(publicId, payload);
    },
    onSuccess: async (data, variables) => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (user) {
        try {
          let action: 'updated' | 'approved' | 'rejected' = 'updated';
          let details = `Updated expense details`;
          
          // Use a more specific action label when the status is explicitly changed
          if ((variables.payload as any).status === 'APPROVED') {
            action = 'approved';
            details = `Approved expense of ₹${data.amount}`;
          } else if ((variables.payload as any).status === 'REJECTED') {
            action = 'rejected';
            details = `Rejected expense of ₹${data.amount}`;
          }
          
          await createActivityLog({
            userId: user.id,
            userName: user.name,
            action,
            entityType: 'expense',
            entityId: variables.publicId,
            entityName: `${data.vendor} - ${data.description}`,
            amount: data.amount,
            societyId: user.societyId,
            details,
          });
        } catch (error) {
          logger.error('[useUpdateExpense] Failed to log activity:', error);
        }
      }
    },
  });
}

/**
 * Hook: useDeleteExpense
 * Purpose: Soft-deletes an expense and refreshes the expenses list and dashboard.
 */
export function useDeleteExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (publicId: string) => {
      return expensesApi.deleteExpense(publicId);
    },
    onSuccess: async (_, publicId) => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (user) {
        try {
          await createActivityLog({
            userId: user.id,
            userName: user.name,
            action: 'deleted',
            entityType: 'expense',
            entityId: publicId,
            societyId: user.societyId,
            details: `Deleted expense`,
          });
        } catch (error) {
          logger.error('[useDeleteExpense] Failed to log activity:', error);
        }
      }
    },
  });
}

/**
 * Hook: useRestoreExpense
 * Purpose: Restores a previously soft-deleted expense.
 * NOTE: restoreExpense is not yet implemented in expensesApi — this hook is a placeholder.
 */
export function useRestoreExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_publicId: string): Promise<never> => {
      throw new Error('Restore expense is not supported by the API yet.');
    },
    onSuccess: async (_data: never, _publicId: string) => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
