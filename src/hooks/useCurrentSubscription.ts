/**
 * useCurrentSubscription
 *
 * Society-scoped subscription hook. Always uses backend data.
 *
 * Data source priority:
 *   1. GET /subscriptions/current  (society-scoped, preferred)
 *   2. GET /subscriptions/status   (legacy fallback)
 */
import { useCallback, useEffect, useState } from 'react';
import { subscriptionApi } from '../api/subscriptionApi';
import { useAuth } from '../contexts/AuthProvider';

export interface CurrentSubscriptionState {
  /** Locked price at subscribe time — from subscriptions.subscribed_amount */
  subscribedAmount: number | null;
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'past_due' | null;
  planName: string | null;
  /** ISO string — next billing / expiry date */
  currentPeriodEnd: string | null;
  accessAllowed: boolean;
  trialDaysRemaining: number | null;
  trialEnd: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: CurrentSubscriptionState = {
  subscribedAmount: null,
  status: null,
  planName: null,
  currentPeriodEnd: null,
  accessAllowed: false,
  trialDaysRemaining: null,
  trialEnd: null,
  loading: false,
  error: null,
};

export function useCurrentSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<CurrentSubscriptionState>(initialState);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Primary: society-scoped current subscription
      const societyId = user?.societyPublicId ?? user?.societyId ?? '';
      const current = await subscriptionApi.getCurrent(societyId || undefined);

      if (current) {
        setState(prev => ({
          ...prev,
          subscribedAmount: current.subscribedAmount ?? current.monthlyAmount ?? null,
          status: (current.status as CurrentSubscriptionState['status']) ?? null,
          planName: current.planName ?? null,
          currentPeriodEnd: current.currentPeriodEnd ?? null,
          accessAllowed: current.accessAllowed,
          trialDaysRemaining: current.trialDaysRemaining ?? null,
          trialEnd: current.trialEndDate ?? null,
          loading: false,
          error: null,
        }));
        return;
      }

      // Fallback: legacy status endpoint
      const legacy = await subscriptionApi.getStatus();
      setState(prev => ({
        ...prev,
        subscribedAmount: legacy.subscribedAmount ?? legacy.monthlyAmount ?? null,
        status: (legacy.status as CurrentSubscriptionState['status']) ?? null,
        planName: legacy.planName ?? null,
        currentPeriodEnd: legacy.currentPeriodEnd ?? null,
        accessAllowed: legacy.accessAllowed,
        trialDaysRemaining: legacy.trialDaysRemaining ?? null,
        trialEnd: legacy.trialEndDate ?? null,
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      // 401 handled globally by axios interceptor
      if (err?.response?.status === 401) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      // 404 = no subscription yet — not an error
      if (err?.response?.status === 404) {
        setState(prev => ({ ...prev, ...initialState, loading: false }));
        return;
      }
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load subscription';
      setState(prev => ({ ...prev, loading: false, error: msg }));
    }
  }, [user?.societyPublicId, user?.societyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
