import { ApiResponse } from '../types/api';
import { unwrapArrayData } from './responseUtils';
import apiClient from './client';

/**
 * Payment Mode DTO
 * GET /payment-modes
 */
export interface PaymentModeDto {
  code: string; // Payment mode code: 'cash', 'cheque', 'neft', 'upi', etc.
  displayName: string; // Display name
}

/**
 * Maintenance Payment DTO
 * Contains full payment details
 */
export interface MaintenancePaymentDto {
  publicId: string; // UUID - primary identifier
  societyPublicId?: string; // UUID - society identifier
  flatPublicId: string; // UUID - flat identifier
  flatNumber: string; // Flat number for display
  amount: number;
  paymentDate: string; // ISO 8601 DateTime format
  paymentModeName: string; // Payment mode display name
  paymentModeCode?: string; // Payment mode code (used for edit form)
  referenceNumber?: string | null; // Transaction/cheque reference
  receiptUrl?: string | null; // URL to receipt/proof
  notes?: string | null;
  // Audit fields
  recordedByName?: string; // Recorded by user name
  createdAt: string;
  updatedAt?: string;
  // Allocation info (returned inline with list)
  totalPaid?: number;
  allocations?: { billPublicId: string; allocatedAmount: number; period?: string | null }[];
  remainingAdvance?: number;
}

/**
 * Create Maintenance Payment Request
 * POST /maintenance-payments
 */
export interface CreateMaintenancePaymentDto {
  flatPublicId: string; // UUID - required
  amount: number; // Required, must be > 0
  paymentDate: string; // ISO 8601 DateTime format
  paymentModeId: string; // Required: payment mode code/id
  paymentModeCode?: string; // Backward compatibility for validators expecting paymentModeCode
  referenceNumber?: string; // Transaction/cheque reference
}

export interface PaymentAllocationDto {
  billPublicId: string;
  allocatedAmount: number;
  period?: string | null;
}

export interface CreateMaintenancePaymentResponse {
  totalPaid: number;
  allocations: PaymentAllocationDto[];
  remainingAdvance: number;
}

/**
 * Update Maintenance Payment Request
 * PUT /maintenance-payments/{publicId}
 */
export interface UpdateMaintenancePaymentDto {
  amount?: number;
  paymentDate?: string; // ISO 8601 DateTime format
  paymentModeCode?: string;
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
}

/**
 * Maintenance Summary DTO
 * GET /maintenance-payments/summary?period=2026-02
 */
export interface MaintenanceSummaryDto {
  /** YYYY-MM format — may be absent from response */
  period?: string;
  totalCharges: number;
  totalCollected: number;
  /** Outstanding amount against generated bills only */
  billOutstanding: number;
  /** Remaining opening balance not yet cleared by payments */
  openingBalanceRemaining: number;
  /** billOutstanding + openingBalanceRemaining */
  totalOutstanding: number;
  collectionPercentage: number;
  /** Optional — not always returned by backend */
  totalFlats?: number;
  flatsPaid?: number;
  flatsPending?: number;
}

/**
 * Maintenance Payments API Service
 * All endpoints require authentication and active subscription
 * Society isolation is automatic via JWT token
 */
export const maintenanceApi = {
  /**
   * Create a new maintenance payment
   * POST /maintenance-payments
   * @param payload CreateMaintenancePaymentDto
   * @param idempotencyKey Optional request idempotency key
   * @returns Promise<CreateMaintenancePaymentResponse>
   */
  async createPayment(payload: CreateMaintenancePaymentDto, idempotencyKey?: string): Promise<CreateMaintenancePaymentResponse> {
    const response = await apiClient.post<ApiResponse<CreateMaintenancePaymentResponse>>('/maintenance-payments', payload, {
      headers: idempotencyKey
        ? {
            'Idempotency-Key': idempotencyKey,
          }
        : undefined,
    });
    return response.data.data;
  },

  /**
   * Get payment by public ID
   * GET /maintenance-payments/{publicId}
   * @param publicId UUID of the payment
   * @returns Promise<MaintenancePaymentDto>
   */
  async getById(publicId: string): Promise<MaintenancePaymentDto> {
    const response = await apiClient.get<ApiResponse<MaintenancePaymentDto>>(`/maintenance-payments/${publicId}`);
    return response.data.data;
  },

  /**
   * Update payment details
   * PUT /maintenance-payments/{publicId}
   * @param publicId UUID of the payment
   * @param payload UpdateMaintenancePaymentDto
   * @returns Promise<MaintenancePaymentDto>
   */
  async updatePayment(publicId: string, payload: UpdateMaintenancePaymentDto): Promise<MaintenancePaymentDto> {
    const response = await apiClient.put<ApiResponse<MaintenancePaymentDto>>(`/maintenance-payments/${publicId}`, payload);
    return response.data.data;
  },

  /**
   * Delete payment
   * DELETE /maintenance-payments/{publicId}
   * @param publicId UUID of the payment
   * @returns Promise<void>
   */
  async deletePayment(publicId: string): Promise<void> {
    await apiClient.delete(`/maintenance-payments/${publicId}`);
  },

  /**
   * List all maintenance payments for the society
   * GET /maintenance-payments
   * @returns Promise<MaintenancePaymentDto[]>
   */
  async listBySociety(): Promise<MaintenancePaymentDto[]> {
    const response = await apiClient.get<ApiResponse<unknown>>('/maintenance-payments');
    return unwrapArrayData<MaintenancePaymentDto>(response.data.data, 'payments');
  },

  /**
   * Get maintenance payments for a specific flat
   * GET /maintenance-payments/flat/{flatPublicId}
   * @param flatPublicId UUID of the flat
   * @returns Promise<MaintenancePaymentDto[]>
   */
  async getByFlat(flatPublicId: string): Promise<MaintenancePaymentDto[]> {
    const response = await apiClient.get<ApiResponse<unknown>>(`/maintenance-payments/flat/${flatPublicId}`);
    return unwrapArrayData<MaintenancePaymentDto>(response.data.data, 'payments');
  },

  /**
   * Get available payment modes
   * GET /payment-modes
   * Returns list of payment mode codes and display names
   * @returns Promise<PaymentModeDto[]>
   */
  async getPaymentModes(): Promise<PaymentModeDto[]> {
    const response = await apiClient.get<ApiResponse<unknown>>('/payment-modes');
    return unwrapArrayData<PaymentModeDto>(response.data.data, 'modes');
  },

  /**
   * Get maintenance summary for a specific period
   * GET /maintenance-payments/summary?period=2026-02
   * @param period Billing period in YYYY-MM format
   * @returns Promise<MaintenanceSummaryDto>
   */
  async getSummary(period: string): Promise<MaintenanceSummaryDto> {
    const response = await apiClient.get<ApiResponse<MaintenanceSummaryDto>>('/maintenance-payments/summary', {
      params: { period }
    });
    return response.data.data;
  },
};
