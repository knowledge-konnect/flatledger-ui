import { useMemo } from 'react';
import type { Plan } from './usePlans';

export interface PlanGroup {
  key: string;
  monthlyPlan: Plan | undefined;
  yearlyPlan: Plan | undefined;
  minOrder: number;
}

export const PLAN_META: Record<string, { flatLabel: string; sizeLabel: string }> = {
  basic:      { flatLabel: 'Up to 25 Flats', sizeLabel: 'Small societies' },
  standard:   { flatLabel: 'Up to 50 Flats', sizeLabel: 'Medium societies' },
  '25_flats': { flatLabel: 'Up to 25 Flats', sizeLabel: 'Small societies' },
  '50_flats': { flatLabel: 'Up to 50 Flats', sizeLabel: 'Medium societies' },
};

export function groupPlans(plans: Plan[]): PlanGroup[] {
  const map: Record<string, { monthly?: Plan; yearly?: Plan; minOrder: number }> = {};

  plans
    .filter((p) => p.isActive !== false)
    .forEach((p) => {
      const key = p.planGroup ?? (p.maxFlats != null ? `flats_${p.maxFlats}` : p.id);
      if (!map[key]) map[key] = { minOrder: Infinity };

      const dur = Number(p.durationMonths);
      if (dur === 1) map[key].monthly = p;
      else if (dur === 12) map[key].yearly = p;

      map[key].minOrder = Math.min(map[key].minOrder, Number(p.displayOrder ?? 999));
    });

  return Object.entries(map)
    .sort(([, a], [, b]) => a.minOrder - b.minOrder)
    .map(([key, g]) => ({
      key,
      monthlyPlan: g.monthly,
      yearlyPlan: g.yearly,
      minOrder: g.minOrder,
    }))
    .filter((grp) => (grp.yearlyPlan ?? grp.monthlyPlan) != null);
}

export function pickPlanForCycle(group: PlanGroup, billingCycle: 'monthly' | 'yearly'): Plan | undefined {
  return billingCycle === 'yearly'
    ? (group.yearlyPlan ?? group.monthlyPlan)
    : (group.monthlyPlan ?? group.yearlyPlan);
}

export function planBillingLabel(plan: Plan | null | undefined): string {
  if (!plan) return 'month';
  return Number(plan.durationMonths) === 12 ? 'year' : 'month';
}

export function resolvePlanDisplay(plan: Plan, groupKey?: string) {
  const rawTitle = plan.name.replace(/ - (Monthly|Yearly)$/i, '');
  const metaKey = (groupKey ?? rawTitle).toLowerCase();
  const meta = PLAN_META[metaKey] ?? PLAN_META[rawTitle.toLowerCase()];
  const maxFlats = Number(plan.maxFlats ?? 0);

  return {
    title: meta?.flatLabel ?? (maxFlats > 0 ? `Up to ${maxFlats} Flats` : rawTitle),
    sizeLabel: meta?.sizeLabel ?? plan.description ?? null,
  };
}

export function yearlySavingsLabel(groups: PlanGroup[]): string {
  const grp = groups[0];
  if (!grp) return 'Save with yearly';

  const discount = grp.yearlyPlan?.discountPercentage ?? grp.monthlyPlan?.discountPercentage;
  if (discount != null && discount > 0) return `${discount}% off`;

  const monthly = Number(grp.monthlyPlan?.price ?? 0);
  const yearly = Number(grp.yearlyPlan?.price ?? 0);
  if (monthly > 0 && yearly > 0) {
    const monthsFree = Math.round((monthly * 12 - yearly) / monthly);
    if (monthsFree > 0) return `${monthsFree} months free`;
  }

  return 'Save with yearly';
}

export function usePlanGroups(plans: Plan[]) {
  return useMemo(() => groupPlans(plans), [plans]);
}
