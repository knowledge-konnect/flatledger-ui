import { ApiResponse } from '../types/api';
import { unwrapArrayData } from './responseUtils';
import apiClient from './client';

/* =====================================================
   TYPES & INTERFACES (Following API Documentation)
===================================================== */

/**
 * Create Expense Request
 * POST /expenses
 */
export interface CreateExpenseRequest {
  date: string; // DateOnly format: YYYY-MM-DD
  categoryCode: string; // Required: 'maintenance', 'utilities', 'security', 'cleaning', etc.
  vendor?: string; // Vendor/supplier name
  description?: string; // Expense description (max 500 chars)
  amount: number; // Required, must be > 0
}

/**
 * Update Expense Request
 * PUT /expenses/{publicId}
 */
export interface UpdateExpenseRequest {
  date: string; // DateOnly format: YYYY-MM-DD
  categoryCode: string;
  vendor?: string;
  description?: string;
  amount: number;
}

/**
 * Expense Response DTO
 * Contains full expense details including audit fields
 */
export interface ExpenseResponse {
  publicId: string; // UUID - primary identifier
  societyPublicId?: string; // UUID - society identifier
  dateIncurred: string; // Date when expense occurred
  categoryCode: string; // Expense category code
  vendor?: string;
  description?: string;
  amount: number;
  approvedBy?: number | null;
  approvedByName?: string | null;
  // Audit fields
  createdByName: string;
  createdAt: string;
  updatedByName?: string;
  updatedAt?: string;
}

/**
 * List Expenses Response wrapper
 */
export interface ListExpensesResponse {
  expenses: ExpenseResponse[];
}

/**
 * Expense Category DTO
 * GET /expenses/categories
 */
export interface ExpenseCategory {
  code: string; // Category code: 'maintenance', 'utilities', etc.
  displayName: string; // Display name
}

/* =====================================================
   API SERVICE (Following API Documentation Endpoints)
===================================================== */

/**
 * Expenses API Service
 * All endpoints require authentication
 * Society isolation is automatic via JWT token
 */
export const expensesApi = {
  /**
   * Create a new expense
   * POST /expenses
   * @param payload CreateExpenseRequest
   * @returns Promise<ExpenseResponse>
   */
  async createExpense(payload: CreateExpenseRequest): Promise<ExpenseResponse> {
    const response = await apiClient.post<ApiResponse<ExpenseResponse>>('/expenses', payload);
    return response.data.data;
  },

  /**
   * Get all expenses for the current society
   * GET /expenses
   * @returns Promise<ExpenseResponse[]>
   */
  async listExpenses(): Promise<ExpenseResponse[]> {
    const response = await apiClient.get<ApiResponse<ListExpensesResponse>>('/expenses');
    return unwrapArrayData<ExpenseResponse>(response.data.data, 'expenses');
  },

  /**
   * Get expense by public ID
   * GET /expenses/{publicId}
   * @param publicId UUID of the expense
   * @returns Promise<ExpenseResponse>
   */
  async getExpenseByPublicId(publicId: string): Promise<ExpenseResponse> {
    const response = await apiClient.get<ApiResponse<ExpenseResponse>>(`/expenses/${publicId}`);
    return response.data.data;
  },

  /**
   * Get expenses by date range
   * GET /expenses/range?startDate=2026-02-01&endDate=2026-02-29
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @returns Promise<ExpenseResponse[]>
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
   * @param categoryCode Category code (e.g., 'maintenance', 'utilities')
   * @returns Promise<ExpenseResponse[]>
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
   * @returns Promise<ExpenseCategory[]>
   */
  async getCategories(): Promise<ExpenseCategory[]> {
    const response = await apiClient.get<ApiResponse<{ categories: ExpenseCategory[] }>>(
      '/expenses/categories'
    );
    return unwrapArrayData<ExpenseCategory>(response.data.data, 'categories');
  },

  /**
   * Update an expense
   * PUT /expenses/{publicId}
   * @param publicId UUID of the expense
   * @param payload UpdateExpenseRequest
   * @returns Promise<ExpenseResponse>
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
   * @param publicId UUID of the expense
   * @returns Promise<void>
   */
  async deleteExpense(publicId: string): Promise<void> {
    await apiClient.delete<ApiResponse<{}>>(`/expenses/${publicId}`);
  },
};
