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
  message: string;
  generatedCount: number;
}

export interface GenerateBillForFlatRequest {
  flatPublicId: string; // UUID from FlatResponseDto.publicId
}

export const billingApi = {
  async getStatus(): Promise<BillingStatusDto> {
    const response = await apiClient.get<ApiResponse<BillingStatusDto>>('/billing/status');
    return response.data.data;
  },

  async generate(payload: GenerateBillingRequest): Promise<GenerateBillingResponse> {
    const response = await apiClient.post<ApiResponse<GenerateBillingResponse>>('/billing/generate-monthly', payload);
    return response.data.data;
  },

  async generateForFlat(payload: GenerateBillForFlatRequest): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/billing/generate-for-flat', payload);
  },
};
