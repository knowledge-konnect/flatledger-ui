import { ApiResponse } from '../types/api';
import { unwrapArrayData } from './responseUtils';
import apiClient from './client';

export interface PaymentModeDto {
  id: number;
  code: string;
  displayName: string;
}

export interface MaintenancePaymentDto {
  publicId: string;  // UUID format
  societyId: number;
  flatId: number;
  flatNumber: string;
  billId: number | null;
  amount: number;
  paymentDate: string;
  paymentModeId: number;
  paymentModeName: string;
  referenceNumber: string | null;
  receiptUrl: string | null;
  notes: string | null;
  recordedBy: number;
  recordedByName: string;
  createdAt: string;
}

export interface CreateMaintenancePaymentDto {
  flatId: number;
  amount: number;
  paymentDate: string;
  paymentModeId: number;
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateMaintenancePaymentDto {
  amount?: number;
  paymentDate?: string;
  paymentModeId?: number;
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
}

export const maintenanceApi = {
  async createPayment(payload: CreateMaintenancePaymentDto): Promise<MaintenancePaymentDto> {
    const response = await apiClient.post<ApiResponse<MaintenancePaymentDto>>('/maintenance-payments', payload);
    return response.data.data;
  },

  async getById(publicId: string): Promise<MaintenancePaymentDto> {
    const response = await apiClient.get<ApiResponse<MaintenancePaymentDto>>(`/maintenance-payments/${publicId}`);
    return response.data.data;
  },

  async updatePayment(publicId: string, payload: UpdateMaintenancePaymentDto): Promise<MaintenancePaymentDto> {
    const response = await apiClient.put<ApiResponse<MaintenancePaymentDto>>(`/maintenance-payments/${publicId}`, payload);
    return response.data.data;
  },

  async deletePayment(publicId: string): Promise<void> {
    await apiClient.delete(`/maintenance-payments/${publicId}`);
  },

  async listBySociety(): Promise<MaintenancePaymentDto[]> {
    const response = await apiClient.get<ApiResponse<unknown>>('/maintenance-payments');
    return unwrapArrayData<MaintenancePaymentDto>(response.data.data, 'payments');
  },

  async getByFlat(flatId: number): Promise<MaintenancePaymentDto[]> {
    const response = await apiClient.get<ApiResponse<unknown>>(`/maintenance-payments/flat/${flatId}`);
    return unwrapArrayData<MaintenancePaymentDto>(response.data.data, 'payments');
  },

  async getPaymentModes(): Promise<PaymentModeDto[]> {
    const response = await apiClient.get<ApiResponse<unknown>>('/payment-modes');
    return unwrapArrayData<PaymentModeDto>(response.data.data, 'paymentModes');
  },
};
