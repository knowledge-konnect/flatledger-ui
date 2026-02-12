import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  expensesApi,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseResponse,
  ExpenseCategory,
} from '../api/expensesApi';
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
  return useMutation({
    mutationFn: async (payload: CreateExpenseRequest) => {
      logger.log('[useCreateExpense] Creating expense');
      return expensesApi.createExpense(payload);
    },
    onSuccess: () => {
      logger.log('[useCreateExpense] Success - invalidating expenses query');
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ publicId, payload }: { publicId: string; payload: UpdateExpenseRequest }) => {
      logger.log(`[useUpdateExpense] Updating expense: ${publicId}`);
      return expensesApi.updateExpense(publicId, payload);
    },
    onSuccess: () => {
      logger.log('[useUpdateExpense] Success - invalidating expenses query');
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (publicId: string) => {
      logger.log(`[useDeleteExpense] Deleting expense: ${publicId}`);
      return expensesApi.deleteExpense(publicId);
    },
    onSuccess: () => {
      logger.log('[useDeleteExpense] Success - invalidating expenses query');
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
