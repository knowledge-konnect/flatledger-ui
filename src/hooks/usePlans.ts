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

function normalizePlan(raw: any): Plan | null {
  if (!raw) return null;

  const id = String(raw.id ?? raw.Id ?? '').trim();
  const name = String(raw.name ?? raw.Name ?? '').trim();
  if (!id || !name) return null;

  const normalizedPrice = Number(
    raw.price ?? raw.Price ?? raw.monthlyAmount ?? raw.MonthlyAmount ?? raw.monthly_amount ?? 0
  );
  const normalizedDuration = Number(
    raw.durationMonths ?? raw.DurationMonths ?? raw.duration_months ?? (name.toLowerCase().includes('year') ? 12 : 1)
  );

  return {
    id,
    name,
    price: Number.isFinite(normalizedPrice) ? normalizedPrice : 0,
    currency: raw.currency ?? raw.Currency ?? 'INR',
    isActive: raw.isActive ?? raw.IsActive ?? raw.is_active ?? true,
    description: raw.description ?? raw.Description ?? undefined,
    durationMonths: Number.isFinite(normalizedDuration) && normalizedDuration > 0 ? normalizedDuration : 1,
    maxFlats: raw.maxFlats ?? raw.MaxFlats ?? raw.max_flats ?? undefined,
    planGroup: raw.planGroup ?? raw.PlanGroup ?? raw.plan_group ?? undefined,
    isPopular: raw.isPopular ?? raw.IsPopular ?? raw.is_popular ?? false,
    discountPercentage: raw.discountPercentage ?? raw.DiscountPercentage ?? raw.discount_percentage ?? null,
    displayOrder: raw.displayOrder ?? raw.DisplayOrder ?? raw.display_order ?? 999,
    // Prefer canonical price first because some DB rows keep legacy monthly_amount=0.
    monthlyAmount: Number(
      raw.price ?? raw.Price ?? raw.monthlyAmount ?? raw.MonthlyAmount ?? raw.monthly_amount ?? 0
    ),
  };
}

function normalizePlans(rawPlans: any[]): Plan[] {
  return rawPlans
    .map(normalizePlan)
    .filter((plan): plan is Plan => plan !== null);
}

async function fetchPlans(): Promise<Plan[]> {
  const response = await apiClient.get('/plans');
  const body = response.data;

  // Expected shape: { succeeded: true, data: { plans: [...] } }
  if (body?.data?.plans && Array.isArray(body.data.plans)) {
    return normalizePlans(body.data.plans);
  }
  // Fallback: { succeeded: true, data: [...] }
  if (Array.isArray(body?.data)) {
    return normalizePlans(body.data);
  }
  // Fallback: root-level array
  if (Array.isArray(body)) {
    return normalizePlans(body);
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
