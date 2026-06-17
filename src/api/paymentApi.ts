import { ApiResponse } from '../types/api';
import apiClient from './client';

/* =====================================================
   TYPES & INTERFACES (Following API Documentation)
===================================================== */

/**
 * Subscription Plan — matches backend PlanResponse
 * GET /plans  (public, no auth required)
 */
export interface PaymentPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  monthlyAmount?: number;
  currency: string;
  durationMonths: number;
  maxFlats: number;
  planGroup?: string;
  isActive?: boolean;
  isPopular: boolean;
  discountPercentage?: number | null;
  displayOrder: number;
}

function normalizePaymentPlan(raw: Record<string, unknown>): PaymentPlan {
  const price = Number(
    raw.price ?? raw.Price ?? raw.monthlyAmount ?? raw.MonthlyAmount ?? 0
  );
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    name: String(raw.name ?? raw.Name ?? ''),
    description: (raw.description ?? raw.Description) as string | null | undefined,
    price,
    monthlyAmount: price,
    currency: String(raw.currency ?? raw.Currency ?? 'INR'),
    durationMonths: Number(raw.durationMonths ?? raw.DurationMonths ?? 1),
    maxFlats: Number(raw.maxFlats ?? raw.MaxFlats ?? 0),
    planGroup: (raw.planGroup ?? raw.PlanGroup) as string | undefined,
    isActive: (raw.isActive ?? raw.IsActive) as boolean | undefined,
    isPopular: Boolean(raw.isPopular ?? raw.IsPopular ?? false),
    discountPercentage: (raw.discountPercentage ?? raw.DiscountPercentage) as number | null | undefined,
    displayOrder: Number(raw.displayOrder ?? raw.DisplayOrder ?? 999),
  };
}

/**
 * Create Razorpay Order Request
 * POST /payments/create-order
 */
export interface CreateOrderRequest {
  planId: string;
}

/**
 * Razorpay Order Response
 * POST /payments/create-order
 */
export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

/**
 * Payment Verification Request
 * POST /payments/verify-payment
 */
export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Payment Verification Response
 * POST /payments/verify-payment
 */
export interface VerifyPaymentResponse {
  isValid: boolean;
  message: string;
}

export const paymentApi = {
  async getPlans(): Promise<PaymentPlan[]> {
    const response = await apiClient.get<ApiResponse<{ plans: Record<string, unknown>[] }>>('/plans');
    const raw = response.data.data.plans || [];
    return raw.map(normalizePaymentPlan);
  },

  async getPlanById(id: string): Promise<PaymentPlan> {
    const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/plans/${id}`);
    return normalizePaymentPlan(response.data.data);
  },

  async createOrder(request: CreateOrderRequest): Promise<RazorpayOrderResponse> {
    const response = await apiClient.post<ApiResponse<RazorpayOrderResponse>>('/payments/create-order', request);
    if (!response.data || !response.data.data) {
      throw new Error('Failed to create payment order');
    }
    return response.data.data;
  },

  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const response = await apiClient.post<ApiResponse<VerifyPaymentResponse>>('/payments/verify-payment', request);
    if (!response.data || !response.data.data) {
      throw new Error('Payment verification failed');
    }
    return response.data.data;
  }
};
