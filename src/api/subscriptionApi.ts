import { ApiResponse } from '../types/api';
import apiClient from './client';

// ── Response types (match backend SubscriptionStatusResponse) ────────────────
export interface SubscriptionStatusData {
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'none';
  trialDaysRemaining?: number | null;
  trialEndDate?: string | null;
  accessAllowed: boolean;
  planName?: string | null;
  monthlyAmount?: number | null;
  subscribedAmount?: number | null;
  currency?: string | null;
  currentPeriodEnd?: string | null;
  durationMonths?: number;
  maxFlats?: number | null;
}

export interface TrialData {
  status: 'trial';
  trialDaysRemaining: number;
  trialEndDate: string;
  accessAllowed: boolean;
}

export interface SubscribeResponse {
  subscriptionId: string;
  invoiceId: string;
  status: string;
  amount: number;
  currency?: string;
  invoiceNumber?: string;
  paymentUrl?: string | null;
  orderId?: string;
  keyId?: string;
}

/**
 * Cancel Subscription Request
 * POST /subscriptions/cancel
 * Backend: CancelSubscriptionRequest { Reason?, CancelImmediately: bool = false }
 */
export interface CancelSubscriptionRequest {
  reason: string;
  cancelImmediately?: boolean; // false = cancel at period end (default); true = cancel now
}

export const subscriptionApi = {
  /**
   * Create a 30-day free trial.
   * POST /subscriptions/trial
   */
  async createTrial(): Promise<TrialData> {
    const response = await apiClient.post<ApiResponse<TrialData>>('/subscriptions/trial');
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to create trial subscription');
    }
    return response.data.data;
  },

  /**
   * Get subscription status for the authenticated user's society.
   * GET /subscriptions/status
   */
  async getStatus(): Promise<SubscriptionStatusData> {
    const response = await apiClient.get<ApiResponse<SubscriptionStatusData>>('/subscriptions/status');
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to get subscription status');
    }
    return response.data.data;
  },

  /**
   * Get current subscription (society-scoped).
   * Backend currently exposes GET /subscriptions/status.
   * societyId is ignored client-side because society isolation is enforced
   * server-side via JWT.
   */
  async getCurrent(societyId?: string): Promise<SubscriptionStatusData | null> {
    void societyId;
    const response = await apiClient.get<ApiResponse<SubscriptionStatusData>>('/subscriptions/status');
    if (!response.data.succeeded) return null;
    const d = response.data.data;
    if (!d || d.status === 'none') return null;
    return d;
  },

  /**
   * Subscribe to a plan after Razorpay payment.
   * POST /subscriptions/subscribe
   * paymentMethod defaults to "razorpay" on the backend when omitted,
   * but we send it explicitly to be safe.
   * paymentReference is for offline payments (bank_transfer, cheque, etc.)
   */
  async subscribe(request: {
    planId: string;
    paymentMethod?: string;
    paymentReference?: string;
  }): Promise<SubscribeResponse> {
    const response = await apiClient.post<ApiResponse<SubscribeResponse>>('/subscriptions/subscribe', {
      planId: request.planId,
      paymentMethod: request.paymentMethod ?? 'razorpay',
      ...(request.paymentReference ? { paymentReference: request.paymentReference } : {}),
    });
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to create subscription');
    }
    return response.data.data;
  },

  /**
   * Cancel the current active subscription.
   * POST /subscriptions/cancel
   */
  async cancel(request: CancelSubscriptionRequest): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>('/subscriptions/cancel', request);
    if (!response.data.succeeded) {
      throw new Error(response.data.message || 'Failed to cancel subscription');
    }
  },
};
