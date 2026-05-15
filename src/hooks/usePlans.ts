import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { logger } from '../lib/logger';

export interface Plan {
  id: string;
  name: string;
  // Keep pricing fields but mark as read-only server values. Frontend must not compute pricing.
  price: number;
  currency: string;
  isActive?: boolean;
  description?: string;
  durationMonths: number;
  maxFlats?: number;
  planGroup?: string;
  isPopular?: boolean;
  discountPercentage?: number | null;
  displayOrder?: number;
  // legacy alias kept for backward compat
  monthlyAmount?: number;
}

async function fetchPlans(): Promise<Plan[]> {
  const response = await apiClient.get('/plans');
  const body = response.data;

  // Expected shape: { succeeded: true, data: { plans: [...] } }
  if (body?.data?.plans && Array.isArray(body.data.plans)) {
    return body.data.plans;
  }
  // Fallback: { succeeded: true, data: [...] }
  if (Array.isArray(body?.data)) {
    return body.data;
  }
  // Fallback: root-level array
  if (Array.isArray(body)) {
    return body;
  }

  logger.error('[usePlans] Unexpected /plans response shape:', body);
  throw new Error('Invalid plans data format');
}

export function usePlans() {
  const { data: plans = [], isLoading: plansLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
    staleTime: 5 * 60_000,
  });

  const plansError = error ? (error as Error).message || 'Failed to load plans' : null;

  return { plans, plansLoading, plansError };
}
