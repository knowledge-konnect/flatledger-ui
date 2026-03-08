import { PaginatedResponse, PaginationParams, ApiResponse } from '../types/api';
import apiClient from './client';

export interface Society {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocietyDto {
  name: string;
  address: string;
}

export interface UpdateSocietyDto {
  name?: string;
  address?: string;
}

export const societiesApi = {
  async getSocieties(params?: PaginationParams): Promise<PaginatedResponse<Society>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Society>>>('/societies', { params });
    return response.data.data;
  },

  async getSocietyById(id: string): Promise<Society> {
    const response = await apiClient.get<ApiResponse<Society>>(`/societies/${id}`);
    return response.data.data;
  },

  async createSociety(payload: CreateSocietyDto): Promise<Society> {
    const response = await apiClient.post<ApiResponse<Society>>('/societies', payload);
    return response.data.data;
  },

  async updateSociety(id: string, payload: UpdateSocietyDto): Promise<Society> {
    const response = await apiClient.put<ApiResponse<Society>>(`/societies/${id}`, payload);
    return response.data.data;
  },

  async getMaintenanceConfig(societyId: string): Promise<MaintenanceConfig> {
    const response = await apiClient.get<ApiResponse<MaintenanceConfig>>(`/societies/${societyId}/maintenance-config`);
    return response.data.data;
  },

  async updateMaintenanceConfig(societyId: string, payload: MaintenanceConfigDto): Promise<MaintenanceConfig> {
    const response = await apiClient.put<ApiResponse<MaintenanceConfig>>(`/societies/${societyId}/maintenance-config`, payload);
    return response.data.data;
  }
};

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
