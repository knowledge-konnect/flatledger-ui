import { ApiResponse } from '../types/api';
import apiClient from './client';

export interface BillingStatusDto {
  currentMonth: string; // YYYY-MM
  isGenerated: boolean;
  generatedCount: number;
}

export interface GenerateBillingRequest {
  period: string; // YYYY-MM
}

export interface GenerateBillingResponse {
  period: string;
  billsCreated: number;
  warnings?: string[] | null;
}

export interface GenerateBillForFlatRequest {
  flatPublicId: string; // UUID from FlatResponseDto.publicId
}

/** Response from GenerateMonthlyBillsAsync — used by trigger-monthly-job-now and catchup */
export interface BillingResult {
  totalFlatsProcessed: number;
  billsCreated: number;
  billsSkipped: number;
  failedSocieties: number;
  executionTime: string; // TimeSpan serialised as "hh:mm:ss.fffffff"
  success: boolean;
  errorMessage?: string | null;
}

export interface CatchupBillingRequest {
  /** Target billing period in yyyy-MM format. Omit to default to the previous calendar month. */
  period?: string;
}

export const billingApi = {
  async getStatus(): Promise<BillingStatusDto> {
    const response = await apiClient.get<ApiResponse<BillingStatusDto>>('/billing/status');
    return response.data.data;
  },

  /**
   * POST /billing/generate-monthly
   * Generates bills for the calling user's society for the given period.
   * The backend DTO field is `BillingMonth` (not `period`).
   */
  async generate(payload: GenerateBillingRequest): Promise<GenerateBillingResponse> {
    const response = await apiClient.post<ApiResponse<GenerateBillingResponse>>(
      '/billing/generate-monthly',
      { billingMonth: payload.period } // matches backend GenerateMonthlyBillsRequest.BillingMonth
    );
    return response.data.data;
  },

  async generateForFlat(payload: GenerateBillForFlatRequest): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/billing/generate-for-flat', payload);
  },

  /**
   * POST /billing/trigger-monthly-job-now  (SuperAdmin only)
   * Runs the scheduled monthly billing job immediately for the current UTC month.
   */
  async triggerMonthlyJobNow(): Promise<BillingResult> {
    const response = await apiClient.post<ApiResponse<BillingResult>>(
      '/billing/trigger-monthly-job-now'
    );
    return response.data.data;
  },

  /**
   * POST /billing/catchup  (SuperAdmin only)
   * Generates bills for all eligible societies for a specific past period.
   * Defaults to the previous calendar month when period is omitted.
   * Returns 400 if the period is in the future or more than 12 months in the past.
   */
  async catchup(payload?: CatchupBillingRequest): Promise<BillingResult> {
    const response = await apiClient.post<ApiResponse<BillingResult>>(
      '/billing/catchup',
      payload ?? {}
    );
    return response.data.data;
  },
};
