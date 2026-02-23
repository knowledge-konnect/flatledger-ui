import { ApiResponse } from '../types/api';
import apiClient from './client';

/* =====================================================
   TYPES & INTERFACES (Following API Documentation)
===================================================== */

/**
 * Subscription Status Response
 * GET /subscriptions/status
 */
export interface SubscriptionStatusData {
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trialDaysRemaining?: number | null;
  trialEndDate?: string | null;
  accessAllowed: boolean;
  planName?: string | null;
  monthlyAmount?: number | null;
  currency?: string | null;
}

/**
 * Trial Creation Response
 * POST /subscriptions/trial
 */
export interface TrialData {
  status: 'trial';
  trialDaysRemaining: number;
  trialEndDate: string;
  accessAllowed: boolean;
}

/**
 * Subscribe Request
 * POST /subscriptions/subscribe
 */
export interface SubscribeRequest {
  planId: string; // UUID - plan's public identifier
  razorpayOrderId: string; // Razorpay order ID
  razorpayPaymentId: string; // Razorpay payment ID
  razorpaySignature: string; // Razorpay signature for verification
}

/**
 * Subscribe Response
 * POST /subscriptions/subscribe
 */
export interface SubscribeData {
  subscriptionId: string; // UUID
  planName: string;
  status: 'active';
  startDate: string; // ISO 8601 date
  endDate: string; // ISO 8601 date
  amount: number;
  currency: string;
}

/**
 * Cancel Subscription Request
 * POST /subscriptions/cancel
 */
export interface CancelSubscriptionRequest {
  reason: string; // Required cancellation reason
  feedback?: string; // Optional feedback
}

/* =====================================================
   API SERVICE (Following API Documentation Endpoints)
===================================================== */

/**
 * Subscriptions API Service
 * Manages trial and paid subscriptions for users
 */
export const subscriptionApi = {
  /**
   * Create a 30-day free trial subscription
   * POST /subscriptions/trial
   * Automatically called on first user registration/login
   * @returns Promise<TrialData>
   */
  async createTrial(): Promise<TrialData> {
    const response = await apiClient.post<ApiResponse<TrialData>>('/subscriptions/trial');
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to create trial subscription');
    }
    
    return response.data.data;
  },

  /**
   * Get current user's subscription status
   * GET /subscriptions/status
   * Call on app load or feature access to check permissions
   * @returns Promise<SubscriptionStatusData>
   */
  async getStatus(): Promise<SubscriptionStatusData> {
    const response = await apiClient.get<ApiResponse<SubscriptionStatusData>>('/subscriptions/status');
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to get subscription status');
    }
    
    return response.data.data;
  },

  /**
   * Subscribe to a plan after successful payment
   * POST /subscriptions/subscribe
   * Call after Razorpay payment verification
   * @param request SubscribeRequest with payment details
   * @returns Promise<SubscribeData>
   */
  async subscribe(request: SubscribeRequest): Promise<SubscribeData> {
    const response = await apiClient.post<ApiResponse<SubscribeData>>('/subscriptions/subscribe', request);
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to create subscription');
    }
    
    return response.data.data;
  },

  /**
   * Cancel the current active subscription
   * POST /subscriptions/cancel
   * Call from settings page after user confirmation
   * @param request CancelSubscriptionRequest with reason
   * @returns Promise<void>
   */
  async cancel(request: CancelSubscriptionRequest): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>('/subscriptions/cancel', request);
    
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to cancel subscription');
    }
  }
};