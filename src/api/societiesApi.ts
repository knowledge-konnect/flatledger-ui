import { ApiResponse } from '../types/api';
import apiClient from './client';

// ── Society DTOs (matches backend SocietyResponseDto) ────────────────────────
export interface Society {
  publicId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  onboardingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSocietyDto {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
}

// ── Maintenance Config DTOs (matches backend MaintenanceConfigResponse) ───────
export interface MaintenanceConfig {
  societyPublicId: string;
  defaultMonthlyCharge: number;
  dueDayOfMonth: number;
  lateFeePerMonth: number;
  gracePeriodDays: number;
}

export interface MaintenanceConfigDto {
  defaultMonthlyCharge: number;
  dueDayOfMonth: number;
  lateFeePerMonth: number;
  gracePeriodDays: number;
}

export const societiesApi = {
  /**
   * Get the authenticated user's own society.
   * GET /societies
   */
  async getOwnSociety(): Promise<Society> {
    const response = await apiClient.get<ApiResponse<Society>>('/societies');
    return response.data.data;
  },

  /**
   * Get a society by its public ID (must belong to the caller).
   * GET /societies/{publicId}
   */
  async getSocietyById(publicId: string): Promise<Society> {
    const response = await apiClient.get<ApiResponse<Society>>(`/societies/${publicId}`);
    return response.data.data;
  },

  /**
   * Update the society's profile. Society Admin only.
   * PUT /societies/{publicId}
   */
  async updateSociety(publicId: string, payload: UpdateSocietyDto): Promise<Society> {
    const response = await apiClient.put<ApiResponse<Society>>(`/societies/${publicId}`, payload);
    return response.data.data;
  },

  /**
   * Get maintenance billing config for a society.
   * GET /societies/{societyPublicId}/maintenance-config
   */
  async getMaintenanceConfig(societyPublicId: string): Promise<MaintenanceConfig> {
    const response = await apiClient.get<ApiResponse<MaintenanceConfig>>(
      `/societies/${societyPublicId}/maintenance-config`
    );
    return response.data.data;
  },

  /**
   * Create or update maintenance billing config.
   * PUT /societies/{societyPublicId}/maintenance-config
   */
  async updateMaintenanceConfig(
    societyPublicId: string,
    payload: MaintenanceConfigDto
  ): Promise<MaintenanceConfig> {
    const response = await apiClient.put<ApiResponse<MaintenanceConfig>>(
      `/societies/${societyPublicId}/maintenance-config`,
      payload
    );
    return response.data.data;
  },
};
