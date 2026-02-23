import apiClient from './client';
import { ApiResponse } from '../types/api';
import {
  OpeningBalanceStatus,
  OpeningBalanceRequest,
  OpeningBalanceSubmitResponse,
} from '../types/openingBalance.types';

/**
 * Opening Balance API Service
 * One-time setup for migrating existing balances
 * 
 * NOTE: Backend endpoints may not be implemented yet.
 * The useOpeningBalanceStatus hook handles 404 errors gracefully
 * and returns a default state when the endpoint doesn't exist.
 * 
 * Required Backend Endpoints:
 * - GET  /api/v1/opening-balance/status
 * - POST /api/v1/opening-balance
 */
export const openingBalanceApi = {
  /**
   * Check if opening balance has been applied
   * GET /api/v1/opening-balance/status
   */
  async getStatus(): Promise<OpeningBalanceStatus> {
    const response = await apiClient.get<ApiResponse<OpeningBalanceStatus>>(
      '/opening-balance/status'
    );
    return response.data.data;
  },

  /**
   * Submit opening balance (one-time operation)
   * POST /api/v1/opening-balance
   */
  async submitOpeningBalance(
    payload: OpeningBalanceRequest
  ): Promise<OpeningBalanceSubmitResponse> {
    const response = await apiClient.post<ApiResponse<OpeningBalanceSubmitResponse>>(
      '/opening-balance',
      payload
    );
    return response.data.data;
  },
};
