import { ApiResponse } from '../types/api';
import { unwrapArrayData } from './responseUtils';
import apiClient from './client';

/**
 * Flat DTO following API documentation structure
 * All entities use publicId (UUID) as primary identifier
 */
export interface FlatDto {
  id?: number; // Internal numeric ID
  publicId: string; // UUID - primary identifier
  societyPublicId?: string; // UUID - society identifier
  flatNo: string;
  ownerName: string;
  contactMobile: string;
  contactEmail: string;
  maintenanceAmount: number;
  totalOutstanding?: number; // Included in list response
  statusId: number; // Numeric status ID (1, 2, 3, etc.)
  statusName: string; // Display name (e.g., "Owner Occupied", "Tenant Occupied")
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Flat request payload
 * POST /flats
 */
export interface CreateFlatDto {
  flatNo: string; // Required, unique within society
  ownerName?: string;
  contactMobile?: string;
  contactEmail?: string;
  maintenanceAmount?: number; // Default: 0
  statusCode?: string; // Valid values: 'owner_occupied' | 'tenant_occupied' | 'vacant' | 'under_maintenance'
}

/**
 * Update Flat request payload
 * PUT /flats
 */
export interface UpdateFlatDto {
  publicId: string; // UUID - required
  flatNo: string;
  ownerName?: string;
  contactMobile?: string;
  contactEmail?: string;
  maintenanceAmount?: number;
  statusCode?: string; // Valid values: 'owner_occupied' | 'tenant_occupied' | 'vacant' | 'under_maintenance'
}

/**
 * Flat Status DTO
 * GET /flats/statuses
 */
export interface FlatStatusDto {
  id: number; // Numeric status ID (1, 2, 3, etc.)
  code: string; // Status code: 'occupied', 'vacant', 'rented'
  displayName: string; // Display name (e.g., "Owner Occupied")
}

/**
 * Financial Summary for a flat
 * GET /flats/{publicId}/financial-summary
 * Matches backend FlatFinancialSummaryResponse exactly.
 */
export interface FlatFinancialSummaryDto {
  /** Flat public UUID — populated by getBulkFinancialSummary from the response map key */
  flatPublicId?: string;
  openingBalanceRemaining: number;
  billOutstanding: number;
  /** Positive = member owes society; Negative = society owes member (advance) */
  totalOutstanding: number;
  totalCharges: number;
  totalPayments: number;
  balance_sign_legend?: string;
}

export interface FlatLedgerBillDto {
  billPublicId?: string;
  period: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  statusCode: string;
  /** @deprecated use statusCode */
  status?: string;
}

/**
 * Complete ledger for a flat
 * GET /flats/{publicId}/ledger
 */
export interface FlatLedgerDto {
  flatPublicId?: string;
  flatNo?: string;
  ownerName?: string;
  bills: FlatLedgerBillDto[];
  totalOutstanding: number;
  totalAdvance: number;
}

/**
 * Bulk create request payload
 * POST /flats/bulk
 */
export interface BulkCreateFlatsPayload {
  flats: CreateFlatDto[];
  skipBilling?: boolean; // If true, skip bill generation for these flats
}

/**
 * Individual failure record from bulk create
 */
export interface BulkFlatFailure {
  index: number;
  flatNo: string;
  error: string;
}

/**
 * Bulk create response
 */
export interface BulkCreateFlatsResponse {
  succeeded: FlatDto[];
  failed: BulkFlatFailure[];
}

/**
 * Flats API Service
 * All endpoints require authentication and active subscription (unless specified)
 * Society isolation is automatic via JWT token
 */
export const flatsApi = {
  /**
   * Create a new flat in the society
   * POST /flats
   * @param payload CreateFlatDto
   * @returns Promise<FlatDto>
   */
  async createFlat(payload: CreateFlatDto): Promise<FlatDto> {
    const response = await apiClient.post<ApiResponse<FlatDto>>('/flats', payload);
    return response.data.data;
  },

  /**
   * Get flat by public ID
   * GET /flats/{publicId}
   * @param publicId UUID of the flat
   * @returns Promise<FlatDto>
   */
  async getByPublicId(publicId: string): Promise<FlatDto> {
    const response = await apiClient.get<ApiResponse<FlatDto>>(`/flats/${publicId}`);
    return response.data.data;
  },

  /**
   * Update flat details
   * PUT /flats
   * @param payload UpdateFlatDto with publicId
   * @returns Promise<FlatDto>
   */
  async updateFlat(payload: UpdateFlatDto): Promise<FlatDto> {
    const response = await apiClient.put<ApiResponse<FlatDto>>('/flats', payload);
    return response.data.data;
  },

  /**
   * Delete flat (soft delete)
   * DELETE /flats/{publicId}
   * @param publicId UUID of the flat
   * @returns Promise<void>
   */
  async deleteFlat(publicId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<null>>(`/flats/${publicId}`);
    return response.data.data as unknown as void;
  },

  /**
   * List all flats in the authenticated user's society
   * GET /flats
   * Returns array of flats (society isolation automatic)
   * @returns Promise<FlatDto[]>
   */
  async listBySociety(): Promise<FlatDto[]> {
    const response = await apiClient.get<ApiResponse<unknown>>('/flats');
    return unwrapArrayData<FlatDto>(response.data.data, 'flats');
  },

  /**
   * Get available flat statuses
   * GET /flats/statuses
   * Returns list of status codes and display names
   * @returns Promise<FlatStatusDto[]>
   */
  async getStatuses(): Promise<FlatStatusDto[]> {
    const response = await apiClient.get<ApiResponse<unknown>>('/flats/statuses');
    return unwrapArrayData<FlatStatusDto>(response.data.data, 'statuses');
  },

  /**
   * Get financial summary for a specific flat
   * GET /flats/{publicId}/financial-summary
   * Returns opening balance, charges, payments, outstanding
   * @param publicId UUID of the flat
   * @returns Promise<FlatFinancialSummaryDto>
   */
  async getFinancialSummary(publicId: string): Promise<FlatFinancialSummaryDto> {
    const response = await apiClient.get<ApiResponse<FlatFinancialSummaryDto>>(`/flats/${publicId}/financial-summary`);
    return response.data.data;
  },

  /**
   * Bulk financial summary for multiple flats
   * POST /flats/financial-summary/bulk
   * @param flatPublicIds Array of flat UUIDs
   * @returns Promise<FlatFinancialSummaryDto[]>
   */
  async getBulkFinancialSummary(flatPublicIds: string[]): Promise<(FlatFinancialSummaryDto & { flatPublicId: string })[]> {
    const response = await apiClient.post<ApiResponse<Record<string, FlatFinancialSummaryDto>>>(
      '/flats/financial-summary/bulk',
      { flatPublicIds }
    );
    return Object.entries(response.data.data || {}).map(([flatPublicId, summary]) => ({
      ...summary,
      flatPublicId,
    }));
  },

  /**
   * Bulk create flats
   * POST /flats/bulk
   * @param payload BulkCreateFlatsPayload
   * @returns Promise<BulkCreateFlatsResponse>
   */
  async bulkCreateFlats(payload: BulkCreateFlatsPayload): Promise<BulkCreateFlatsResponse> {
    const response = await apiClient.post<ApiResponse<BulkCreateFlatsResponse>>('/flats/bulk', payload);
    const data = response.data.data;
    return {
      succeeded: data?.succeeded ?? [],
      failed: data?.failed ?? [],
    };
  },

  /**
   * @param publicId UUID of the flat
   * @param startDate Optional start date filter (ISO 8601)
   * @param endDate Optional end date filter (ISO 8601)
   * @returns Promise<FlatLedgerDto>
   */
  async getLedger(publicId: string, startDate?: string, endDate?: string): Promise<FlatLedgerDto> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get<ApiResponse<FlatLedgerDto>>(`/flats/${publicId}/ledger`, { params });
    return response.data.data;
  },
};
