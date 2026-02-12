import { ApiResponse } from '../types/api';
import apiClient from './client';

// Payment Plan Types
export interface PaymentPlan {
  id: 'basic' | 'standard' | 'pro';
  name: string;
  price: number;
  originalPrice?: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  description?: string;
}

// Razorpay Order Request/Response
export interface CreateOrderRequest {
  planId: string;
  amount: number; // Amount in rupees (will be converted to paise by backend)
  currency?: string; // Default: 'INR'
}
export interface RazorpayOrderResponse {
  succeeded: true;
  data: {
    orderId: string;
    keyId: string;
    amount: number;
    currency: string;
  };
  message: string;
}
export interface RazorpayOrderError {
  succeeded: false;
  error: string;
}

// Payment Verification
export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: string;
}
export interface VerifyPaymentResponse {
  succeeded: true;
  data: {
    subscriptionId: string;
    status: 'active';
    message: string;
  };
}
export interface VerifyPaymentError {
  succeeded: false;
  error: string;
}

// Payment plans configuration
export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 249,
    period: 'monthly',
    features: [
      'Up to 50 flats',
      'Basic financial tracking',
      'Announcement management',
      'Document storage (1GB)',
      'Email support',
    ],
    description: 'Basic plan for small societies',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 499,
    originalPrice: 599,
    period: 'monthly',
    popular: true,
    features: [
      'Up to 200 flats',
      'Advanced financial reports',
      'Maintenance tracking',
      'Document storage (5GB)',
      'Priority email support',
      'API access',
    ],
    description: 'Standard plan for growing societies',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    period: 'monthly',
    features: [
      'Unlimited flats',
      'Custom reports & analytics',
      'Advanced maintenance workflows',
      'Document storage (25GB)',
      'Phone & priority support',
      'White-label option',
      'Custom integrations',
    ],
    description: 'Pro plan for large societies',
  },
];

export const paymentApi = {
  /**
   * Create a Razorpay order for subscription payment
   * @param request Order creation details
   * @returns Promise with orderId and keyId
   */
  async createOrder(request: CreateOrderRequest): Promise<RazorpayOrderResponse | RazorpayOrderError> {
    try {
      const response = await apiClient.post<ApiResponse<RazorpayOrderResponse['data']>>(
        '/payments/create-order',
        request
      );
      if (response.data.succeeded) {
        return {
          succeeded: true,
          data: response.data.data,
          message: response.data.message,
        };
      } else {
        return {
          succeeded: false,
          error: 'Failed to create order',
        };
      }
    } catch (error: any) {
      return {
        succeeded: false,
        error: error.response?.data?.error || error.message || 'Failed to create order',
      };
    }
  },

  /**
   * Verify Razorpay payment with backend
   * CRITICAL: Do NOT trust frontend payment success - always verify with backend
   * @param request Payment details to verify
   * @returns Promise with verification result
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse | VerifyPaymentError> {
    try {
      const response = await apiClient.post<ApiResponse<VerifyPaymentResponse['data']>>(
        '/payments/verify-payment',
        request
      );
      if (response.data.succeeded) {
        return {
          succeeded: true,
          data: response.data.data,
        };
      } else {
        return {
          succeeded: false,
          error: 'Payment verification failed',
        };
      }
    } catch (error: any) {
      return {
        succeeded: false,
        error: error.response?.data?.error || error.message || 'Payment verification failed',
      };
    }
  },

  // Get plan by ID
  getPlanById: (planId: PaymentPlan['id']): PaymentPlan | undefined => {
    return PAYMENT_PLANS.find(plan => plan.id === planId);
  },
};