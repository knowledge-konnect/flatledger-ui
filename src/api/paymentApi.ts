import { ApiResponse } from '../types/api';
import apiClient from './client';

/* =====================================================
   TYPES & INTERFACES (Following API Documentation)
===================================================== */

/**
 * Subscription Plan
 * GET /plans
 */
export interface PaymentPlan {
  id: string; // UUID - plan's public identifier
  name: string;
  description?: string;
  monthlyAmount: number;
  yearlyAmount: number;
  currency: string; // 'INR', 'USD', etc.
  features: string[];
  isActive: boolean;
  popular?: boolean; // For UI display
}

/**
 * Create Razorpay Order Request
 * POST /payments/create-order
 */
export interface CreateOrderRequest {
  planId: string; // UUID of selected plan
}

/**
 * Razorpay Order Response
 * POST /payments/create-order
 */
export interface RazorpayOrderResponse {
  orderId: string; // Razorpay order ID
  amount: number; // Amount in rupees (float)
  currency: string; // 'INR'
  keyId: string; // Razorpay key ID for checkout
}

/**
 * Payment Verification Request
 * POST /payments/verify-payment
 */
export interface VerifyPaymentRequest {
  orderId: string; // Razorpay order ID
  paymentId: string; // Razorpay payment ID
  signature: string; // Razorpay signature for verification
}

/**
 * Payment Verification Response
 * POST /payments/verify-payment
 */
export interface VerifyPaymentResponse {
  isValid: boolean;
  message: string;
}

/* =====================================================
   API SERVICE (Following API Documentation Endpoints)
===================================================== */

/**
 * Payment API Service
 * Handles Razorpay payment integration for subscriptions
 */
export const paymentApi = {
  /**
   * Get all available subscription plans
   * GET /plans
   * Public endpoint - no authentication required
   * @returns Promise<PaymentPlan[]>
   */
  async getPlans(): Promise<PaymentPlan[]> {
    const response = await apiClient.get<ApiResponse<{ plans: PaymentPlan[] }>>('/plans');
    return response.data.data.plans || [];
  },

  /**
   * Get specific plan by ID
   * GET /plans/{id}
   * Public endpoint - no authentication required
   * @param id UUID of the plan
   * @returns Promise<PaymentPlan>
   */
  async getPlanById(id: string): Promise<PaymentPlan> {
    const response = await apiClient.get<ApiResponse<PaymentPlan>>(`/plans/${id}`);
    return response.data.data;
  },

  /**
   * Create a Razorpay order for subscription payment
   * POST /payments/create-order
   * Requires authentication
   * @param request CreateOrderRequest with amount in paise
   * @returns Promise<RazorpayOrderResponse>
   */
  async createOrder(request: CreateOrderRequest): Promise<RazorpayOrderResponse> {
    // Updated endpoint and request body
    const response = await apiClient.post<ApiResponse<{ data: RazorpayOrderResponse }>>('/payments/create-order', request);
    if (!response.data || !response.data.data) {
      throw new Error('Failed to create payment order');
    }
    return response.data.data;
  },

  /**
   * Verify Razorpay payment signature and activate subscription
   * POST /payments/verify-payment
   * Requires authentication
   * @param request VerifyPaymentRequest with payment details
   * @returns Promise<VerifyPaymentResponse>
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    // Updated endpoint and request body
    const response = await apiClient.post<ApiResponse<{ data: VerifyPaymentResponse }>>('/payments/verify-payment', request);
    if (!response.data || !response.data.data) {
      throw new Error('Payment verification failed');
    }
    return response.data.data;
  }
};