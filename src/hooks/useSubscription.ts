import { useState, useEffect, useCallback } from 'react';
import {
  subscriptionApi,
  SubscriptionStatusData,
  TrialData,
  SubscribeResponse,
} from '../api/subscriptionApi';

interface SubscriptionState {
  accessAllowed: boolean;
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'none' | null;
  trialDaysRemaining: number | null;
  planName: string | null;
  subscribedAmount: number | null;
  /** @deprecated use subscribedAmount */
  monthlyAmount: number | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  durationMonths: number;
  loading: boolean;
  error: string | null;
}

interface UseSubscriptionReturn extends SubscriptionState {
  createTrial: () => Promise<TrialData | null>;
  subscribe: (
    planId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => Promise<SubscribeResponse | null>;
  cancelSubscription: (reason: string) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

const initialState: SubscriptionState = {
  accessAllowed: false,
  status: null,
  trialDaysRemaining: null,
  planName: null,
  subscribedAmount: null,
  monthlyAmount: null,
  trialEnd: null,
  currentPeriodEnd: null,
  durationMonths: 1,
  loading: false,
  error: null,
};

function mapStatusToState(data: SubscriptionStatusData): Partial<SubscriptionState> {
  return {
    accessAllowed: data.accessAllowed,
    status: data.status as SubscriptionState['status'],
    trialDaysRemaining: data.trialDaysRemaining ?? null,
    planName: data.planName ?? null,
    subscribedAmount: data.subscribedAmount ?? data.monthlyAmount ?? null,
    monthlyAmount: data.monthlyAmount ?? null,
    trialEnd: data.trialEndDate ?? null,
    currentPeriodEnd: data.currentPeriodEnd ?? null,
    durationMonths: data.durationMonths ?? 1,
    loading: false,
    error: null,
  };
}

export function useSubscription(): UseSubscriptionReturn {
  const [state, setState] = useState<SubscriptionState>(initialState);

  const refreshStatus = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await subscriptionApi.getStatus();
      setState(prev => ({ ...prev, ...mapStatusToState(data) }));
    } catch (error: any) {
      // 401 is handled globally by the axios interceptor — just clear loading
      if (error?.response?.status === 401) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to load subscription';
      setState(prev => ({ ...prev, loading: false, error: msg }));
    }
  }, []);

  const createTrial = useCallback(async (): Promise<TrialData | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await subscriptionApi.createTrial();
      await refreshStatus();
      return data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setState(prev => ({ ...prev, loading: false }));
        return null;
      }
      const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to start trial';
      setState(prev => ({ ...prev, loading: false, error: msg }));
      return null;
    }
  }, [refreshStatus]);

  /**
   * Activates a paid subscription after Razorpay payment verification.
   * Calls POST /subscriptions/subscribe with planId + paymentMethod: "razorpay".
   * The razorpay IDs are passed for context but the backend derives the subscription
   * from the planId — payment verification is handled separately via /payments/verify-payment.
   */
  const subscribe = useCallback(
    async (
      planId: string,
      _razorpayOrderId: string,
      _razorpayPaymentId: string,
      _razorpaySignature: string
    ): Promise<SubscribeResponse | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const data = await subscriptionApi.subscribe({ planId, paymentMethod: 'razorpay' });
        await refreshStatus();
        return data;
      } catch (error: any) {
        if (error?.response?.status === 401) {
          setState(prev => ({ ...prev, loading: false }));
          return null;
        }
        const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to activate subscription';
        setState(prev => ({ ...prev, loading: false, error: msg }));
        return null;
      }
    },
    [refreshStatus]
  );

  const cancelSubscription = useCallback(async (reason: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await subscriptionApi.cancel({ reason });
      await refreshStatus();
      return true;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setState(prev => ({ ...prev, loading: false }));
        return false;
      }
      const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to cancel subscription';
      setState(prev => ({ ...prev, loading: false, error: msg }));
      return false;
    }
  }, [refreshStatus]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    ...state,
    createTrial,
    subscribe,
    cancelSubscription,
    refreshStatus,
    clearError,
  };
}

// ── Legacy compatibility ──────────────────────────────────────────────────────
export interface SubscriptionStatus {
  hasAccess: boolean;
  status: 'trial' | 'active' | 'expired' | 'past_due' | 'cancelled';
  trialDaysRemaining: number;
  planName?: string;
  subscribedAmount?: number;
  /** @deprecated use subscribedAmount */
  monthlyAmount?: number;
}

/** @deprecated Use useSubscription instead */
export const useSubscriptionCheck = (_userId?: string) => {
  const sub = useSubscription();
  const subscriptionStatus: SubscriptionStatus = {
    hasAccess: sub.accessAllowed,
    status: (sub.status as any) || 'trial',
    trialDaysRemaining: sub.trialDaysRemaining ?? 0,
    planName: sub.planName ?? undefined,
    subscribedAmount: sub.subscribedAmount ?? undefined,
    monthlyAmount: sub.monthlyAmount ?? undefined,
  };
  return { subscriptionStatus, loading: sub.loading, error: sub.error, refetch: sub.refreshStatus };
};
