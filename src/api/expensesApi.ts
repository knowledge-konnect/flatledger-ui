import { ApiResponse } from '../types/api';
import { unwrapArrayData } from './responseUtils';
import apiClient from './client';

/* =====================================================
   TYPES & INTERFACES
===================================================== */

export interface CreateExpenseRequest {
  date: string;
  categoryCode: string;
  vendor: string;
  description: string;
  amount: number;
  attachmentId?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface UpdateExpenseRequest {
  date: string;
  categoryCode: string;
  vendor: string;
  description: string;
  amount: number;
  attachmentId?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ExpenseResponse {
  publicId: string;
  societyId: number;
  dateIncurred: string;
  categoryCode: string;
  vendor: string;
  description: string;
  amount: number;
  attachmentId?: number;
  approvedBy?: number | null;
  approvedByName?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdBy: number;
  createdByName: string;
  createdAt: string;
}

export interface ListExpensesResponse {
  expenses: ExpenseResponse[];
}

export interface ExpenseCategory {
  id: number;
  code: string;
  displayName: string;
}

export interface ExpenseCategoriesResponse {
  categories: ExpenseCategory[];
}

/* =====================================================
   API SERVICE
===================================================== */

export const expensesApi = {
  /**
   * Create a new expense
   * POST /expenses
   */
  async createExpense(payload: CreateExpenseRequest): Promise<ExpenseResponse> {
    const response = await apiClient.post<ApiResponse<ExpenseResponse>>('/expenses', payload);
    return response.data.data;
  },

  /**
   * Get all expenses for the current society
   * GET /expenses
   */
  async listExpenses(): Promise<ExpenseResponse[]> {
    const response = await apiClient.get<ApiResponse<ListExpensesResponse>>('/expenses');
    return unwrapArrayData<ExpenseResponse>(response.data.data, 'expenses');
  },

  /**
   * Get expense by public ID
   * GET /expenses/{publicId}
   */
  async getExpenseByPublicId(publicId: string): Promise<ExpenseResponse> {
    const response = await apiClient.get<ApiResponse<ExpenseResponse>>(`/expenses/${publicId}`);
    return response.data.data;
  },

  /**
   * Get expenses by date range
   * GET /expenses/range?startDate=2026-02-01&endDate=2026-02-29
   */
  async getExpensesByDateRange(startDate: string, endDate: string): Promise<ExpenseResponse[]> {
    const response = await apiClient.get<ApiResponse<ListExpensesResponse>>('/expenses/range', {
      params: { startDate, endDate },
    });
    return unwrapArrayData<ExpenseResponse>(response.data.data, 'expenses');
  },

  /**
   * Get expenses by category
   * GET /expenses/category/{categoryCode}
   */
  async getExpensesByCategory(categoryCode: string): Promise<ExpenseResponse[]> {
    const response = await apiClient.get<ApiResponse<ListExpensesResponse>>(
      `/expenses/category/${categoryCode}`
    );
    return unwrapArrayData<ExpenseResponse>(response.data.data, 'expenses');
  },

  /**
   * Get all expense categories
   * GET /expenses/categories
   */
  async getCategories(): Promise<ExpenseCategory[]> {
    const response = await apiClient.get<ApiResponse<ExpenseCategoriesResponse>>(
      '/expenses/categories'
    );
    return unwrapArrayData<ExpenseCategory>(response.data.data, 'categories');
  },

  /**
   * Update an expense
   * PUT /expenses/{publicId}
   */
  async updateExpense(publicId: string, payload: UpdateExpenseRequest): Promise<ExpenseResponse> {
    const response = await apiClient.put<ApiResponse<ExpenseResponse>>(
      `/expenses/${publicId}`,
      payload
    );
    return response.data.data;
  },

  /**
   * Delete an expense
   * DELETE /expenses/{publicId}
   */
  async deleteExpense(publicId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/expenses/${publicId}`);
  },
};
