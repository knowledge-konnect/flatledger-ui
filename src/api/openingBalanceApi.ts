import apiClient from './client';
import { ApiResponse } from '../types/api';
import {
  OpeningBalanceAppliedSummary,
  OpeningBalanceStatus,
  OpeningBalanceRequest,
  OpeningBalanceSubmitResponse,
} from '../types/openingBalance.types';

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function firstDefinedNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const normalized = toNumber(value);
    if (normalized !== undefined) {
      return normalized;
    }
  }
  return undefined;
}

function pickStatusSource(raw: any) {
  const data = raw?.data ?? raw ?? {};
  return data.status ?? data.openingBalanceStatus ?? data.opening_balance_status ?? data;
}

function pickSummarySource(raw: any) {
  const data = raw?.data ?? raw ?? {};
  return (
    data.summary ??
    data.openingBalanceSummary ??
    data.opening_balance_summary ??
    data.openingBalance ??
    data.opening_balance ??
    data
  );
}

function normalizeStatus(raw: any): OpeningBalanceStatus {
  const src = pickStatusSource(raw);
  const summary = pickSummarySource(raw);
  return {
    isApplied: Boolean(src.isApplied ?? src.is_applied ?? false),
    appliedAt: src.appliedAt ?? src.applied_at ?? null,
    appliedBy: src.appliedBy ?? src.applied_by ?? null,
    societyOpeningAmount: firstDefinedNumber(
      src.societyOpeningAmount,
      src.society_opening_amount,
      summary.societyOpeningAmount,
      summary.society_opening_amount,
      summary.societyBalance,
      summary.society_balance,
      summary.bankBalance,
      summary.bank_balance
    ),
    totalMemberDues: firstDefinedNumber(
      src.totalMemberDues,
      src.total_member_dues,
      summary.totalMemberDues,
      summary.total_member_dues,
      summary.totalOutstanding,
      summary.total_outstanding,
      summary.outstandingAmount,
      summary.outstanding_amount
    ),
    totalMemberAdvance: firstDefinedNumber(
      src.totalMemberAdvance,
      src.total_member_advance,
      summary.totalMemberAdvance,
      summary.total_member_advance,
      summary.totalAdvance,
      summary.total_advance,
      summary.advanceAmount,
      summary.advance_amount
    ),
  };
}

function normalizeAppliedSummary(raw: any): OpeningBalanceAppliedSummary | null {
  const src = pickSummarySource(raw);
  const summary: OpeningBalanceAppliedSummary = {
    societyOpeningAmount: firstDefinedNumber(
      src.societyOpeningAmount,
      src.society_opening_amount,
      src.societyBalance,
      src.society_balance,
      src.bankBalance,
      src.bank_balance
    ),
    totalMemberDues: firstDefinedNumber(
      src.totalMemberDues,
      src.total_member_dues,
      src.totalOutstanding,
      src.total_outstanding,
      src.outstandingAmount,
      src.outstanding_amount
    ),
    totalMemberAdvance: firstDefinedNumber(
      src.totalMemberAdvance,
      src.total_member_advance,
      src.totalAdvance,
      src.total_advance,
      src.advanceAmount,
      src.advance_amount
    ),
  };

  if (
    summary.societyOpeningAmount === undefined &&
    summary.totalMemberDues === undefined &&
    summary.totalMemberAdvance === undefined
  ) {
    return null;
  }

  return summary;
}

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
    try {
      const response = await apiClient.get<ApiResponse<any>>('/opening-balance/status');
      return normalizeStatus(response.data);
    } catch (error: any) {
      if (error?.response?.status !== 404) throw error;
      // Backward compatibility in case backend mounts routes under /v1.
      const response = await apiClient.get<ApiResponse<any>>('/v1/opening-balance/status');
      return normalizeStatus(response.data);
    }
  },

  /**
   * Fetch applied opening-balance summary for the locked state page.
   * Tries dedicated summary endpoints first, then falls back to GET detail endpoints.
   */
  async getAppliedSummary(): Promise<OpeningBalanceAppliedSummary | null> {
    const endpoints = [
      '/opening-balance/summary',
      '/opening-balance',
      '/v1/opening-balance/summary',
      '/v1/opening-balance',
    ];

    let lastNon404Error: unknown = null;

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<ApiResponse<any>>(endpoint);
        const summary = normalizeAppliedSummary(response.data);
        if (summary) {
          return summary;
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          continue;
        }
        lastNon404Error = error;
        break;
      }
    }

    if (lastNon404Error) {
      throw lastNon404Error;
    }

    return null;
  },

  /**
   * Submit opening balance (one-time operation)
   * POST /api/v1/opening-balance
   */
  async submitOpeningBalance(
    payload: OpeningBalanceRequest
  ): Promise<OpeningBalanceSubmitResponse> {
    try {
      const response = await apiClient.post<ApiResponse<OpeningBalanceSubmitResponse>>(
        '/opening-balance',
        payload
      );
      return response.data.data;
    } catch (error: any) {
      if (error?.response?.status !== 404) throw error;
      const response = await apiClient.post<ApiResponse<OpeningBalanceSubmitResponse>>(
        '/v1/opening-balance',
        payload
      );
      return response.data.data;
    }
  },
};
