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
  amount: number; // Amount in paise (e.g., 49900 = ₹499.00)
}

/**
 * Razorpay Order Response
 * POST /payments/create-order
 */
export interface RazorpayOrderResponse {
  orderId: string; // Razorpay order ID
  amount: number; // Amount in paise
  currency: string; // 'INR'
  key: string; // Razorpay key ID for checkout
}

/**
 * Payment Verification Request
 * POST /payments/verify-payment
 */
export interface VerifyPaymentRequest {
  razorpayOrderId: string; // Razorpay order ID
  razorpayPaymentId: string; // Razorpay payment ID
  razorpaySignature: string; // Razorpay signature for verification
}

/**
 * Payment Verification Response
 * POST /payments/verify-payment
 */
export interface VerifyPaymentResponse {
  verified: boolean;
  subscriptionStatus: 'active' | 'expired' | 'trial' | 'cancelled';
  subscriptionEndDate?: string; // ISO 8601 date
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
    const response = await apiClient.post<ApiResponse<RazorpayOrderResponse>>('/payments/create-order', request);
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to create payment order');
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
    const response = await apiClient.post<ApiResponse<VerifyPaymentResponse>>('/payments/verify-payment', request);
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Payment verification failed');
    }
    
    return response.data.data;
  }
};