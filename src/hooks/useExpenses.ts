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
===================================================== */

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<ExpenseResponse[]> => {
      logger.log('[useExpenses] Fetching expenses');
      const result = await expensesApi.listExpenses();
      logger.log(`[useExpenses] Loaded ${result.length} expenses`);
      return result;
    },
  });
}

export function useExpenseByPublicId(publicId?: string) {
  return useQuery({
    queryKey: ['expenses', publicId],
    queryFn: async (): Promise<ExpenseResponse> => {
      if (!publicId) throw new Error('Public ID is required');
      logger.log(`[useExpenseByPublicId] Fetching expense: ${publicId}`);
      const result = await expensesApi.getExpenseByPublicId(publicId);
      logger.log(`[useExpenseByPublicId] Loaded expense: ${result.publicId}`);
      return result;
    },
    enabled: !!publicId,
  });
}

export function useExpensesByDateRange(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['expenses', 'dateRange', startDate, endDate],
    queryFn: async (): Promise<ExpenseResponse[]> => {
      if (!startDate || !endDate) throw new Error('Start date and end date are required');
      logger.log(`[useExpensesByDateRange] Fetching expenses from ${startDate} to ${endDate}`);
      const result = await expensesApi.getExpensesByDateRange(startDate, endDate);
      logger.log(`[useExpensesByDateRange] Loaded ${result.length} expenses`);
      return result;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useExpensesByCategory(categoryCode?: string) {
  return useQuery({
    queryKey: ['expenses', 'category', categoryCode],
    queryFn: async (): Promise<ExpenseResponse[]> => {
      if (!categoryCode) throw new Error('Category code is required');
      logger.log(`[useExpensesByCategory] Fetching expenses for category: ${categoryCode}`);
      const result = await expensesApi.getExpensesByCategory(categoryCode);
      logger.log(`[useExpensesByCategory] Loaded ${result.length} expenses`);
      return result;
    },
    enabled: !!categoryCode,
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expenses', 'categories'],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      logger.log('[useExpenseCategories] Fetching expense categories');
      const result = await expensesApi.getCategories();
      logger.log(`[useExpenseCategories] Loaded ${result.length} categories`);
      return result;
    },
  });
}

/* =====================================================
   MUTATIONS
===================================================== */

export function useCreateExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: CreateExpenseRequest) => {
      logger.log('[useCreateExpense] Creating expense');
      return expensesApi.createExpense(payload);
    },
    onSuccess: async (data) => {
      logger.log('[useCreateExpense] Success - invalidating expenses query');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      
      // Log activity
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
          logger.error('[useCreateExpense] Failed to log activity:', error);
        }
      }
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ publicId, payload }: { publicId: string; payload: UpdateExpenseRequest }) => {
      logger.log(`[useUpdateExpense] Updating expense: ${publicId}`);
      return expensesApi.updateExpense(publicId, payload);
    },
    onSuccess: async (data, variables) => {
      logger.log('[useUpdateExpense] Success - invalidating expenses query');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      
      // Log activity based on status change
      if (user) {
        try {
          let action: 'updated' | 'approved' | 'rejected' = 'updated';
          let details = `Updated expense details`;
          
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

export function useDeleteExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (publicId: string) => {
      logger.log(`[useDeleteExpense] Deleting expense: ${publicId}`);
      return expensesApi.deleteExpense(publicId);
    },
    onSuccess: async (_, publicId) => {
      logger.log('[useDeleteExpense] Success - invalidating expenses query');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      
      // Log activity
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

export function useRestoreExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (publicId: string) => {
      logger.log(`[useRestoreExpense] Restoring expense: ${publicId}`);
      return expensesApi.restoreExpense(publicId);
    },
    onSuccess: async (data) => {
      logger.log('[useRestoreExpense] Success - invalidating expenses query');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      
      // Log activity
      if (user) {
        try {
          await createActivityLog({
            userId: user.id,
            userName: user.name,
            action: 'updated',
            entityType: 'expense',
            entityId: data.publicId,
            entityName: `${data.vendor} - ${data.description}`,
            societyId: user.societyId,
            details: 'Restored deleted expense',
          });
        } catch (error) {
          logger.error('[useRestoreExpense] Failed to log activity:', error);
        }
      }
    },
  });
}
