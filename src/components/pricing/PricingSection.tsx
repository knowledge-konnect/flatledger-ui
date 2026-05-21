import { useState, useMemo } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { usePlans, type Plan } from '../../hooks/usePlans';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanGroup {
  key: string;
  monthlyPlan: Plan | undefined;
  yearlyPlan: Plan | undefined;
  minOrder: number;
  isPopular: boolean;
}

interface PricingSectionProps {
  /** Called with the selected plan's ID when the CTA button is clicked */
  onChoosePlan: (planId: string) => void;
  /** Disables all CTA buttons (e.g. during an async redirect) */
  isBusy?: boolean;
  /**
   * ID of the plan the society is currently subscribed to.
   * When set, the matching card shows a "Current Plan" label instead of a CTA
   * and shows the "Your price is locked" notice.
   */
  currentPlanId?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BENEFITS = [
  'Generate bills in seconds',
  'Track payments instantly',
  'View financial reports',
  'See full society finances',
];

const DISPLAY_PRICING: Record<number, { monthly: number; yearly: number; perMonth: number; savePercent: number }> = {
  50: { monthly: 199, yearly: 1499, perMonth: 125, savePercent: 37 },
  100: { monthly: 349, yearly: 2999, perMonth: 250, savePercent: 30 },
};

/** Display name keyed by maxFlats */
const PLAN_DISPLAY_NAMES: Record<number, string> = {
  50: 'Starter',
  100: 'Growth',
};

/** Flat-range subtitle on the card, keyed by maxFlats */
const PLAN_FLAT_SUBTITLES: Record<number, string> = {
  50: 'Up to 50 Flats',
  100: '51–100 Flats',
};

/** Helper text line below flat subtitle, keyed by maxFlats */
const SIZE_SUBTITLES: Record<number, string> = {
  25: 'Best for small apartments',
  50: 'Best for small apartments',
  100: 'Best for larger societies',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PricingSection({
  onChoosePlan,
  isBusy = false,
  currentPlanId = null,
}: PricingSectionProps) {
  const { plans, plansLoading, plansError } = usePlans();
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('monthly');

  // Group plans by planGroup. When planGroup is absent (monthly-only plans like
  // "Up to 50 Flats - Monthly") fall back to maxFlats so each tier gets its own card.
  const groups = useMemo<PlanGroup[]>(() => {
    const map: Record<string, { monthly?: Plan; yearly?: Plan; minOrder: number }> = {};

    plans.forEach((p) => {
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
        isPopular: !!(g.monthly?.isPopular || g.yearly?.isPopular),
      }));
  }, [plans]);

  const visibleGroups = useMemo(
    () => groups
      .filter((grp) => {
        const maxFlats = Number(grp.yearlyPlan?.maxFlats ?? grp.monthlyPlan?.maxFlats ?? 0);
        return maxFlats === 50 || maxFlats === 100;
      })
      .sort((a, b) => {
        const aFlats = Number(a.yearlyPlan?.maxFlats ?? a.monthlyPlan?.maxFlats ?? 0);
        const bFlats = Number(b.yearlyPlan?.maxFlats ?? b.monthlyPlan?.maxFlats ?? 0);
        return aFlats - bFlats;
      }),
    [groups],
  );

  // ── Loading / error states ──────────────────────────────────────────────────

  if (plansLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading plans…</p>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{plansError}</p>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Please try again later for live pricing.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── Billing cycle toggle ── */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              billingCycle === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              billingCycle === 'yearly'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Yearly <span className="ml-1 text-xs font-bold opacity-80">(Recommended)</span>
          </button>
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full">
        {visibleGroups.map((grp, index) => {
          const maxFlats = Number(grp.yearlyPlan?.maxFlats ?? grp.monthlyPlan?.maxFlats ?? 0);
          // Active plan changes with billing cycle; fall back to whichever variant exists
          const activePlan = billingCycle === 'yearly'
            ? (grp.yearlyPlan ?? grp.monthlyPlan)
            : (grp.monthlyPlan ?? grp.yearlyPlan);

          if (!activePlan) return null;

          const pricing = DISPLAY_PRICING[maxFlats];

          if (!pricing) return null;

          const { monthly: monthlyPrice, yearly: yearlyPrice, perMonth: perMonthEquiv, savePercent } = pricing;

          const title        = PLAN_DISPLAY_NAMES[maxFlats] ?? (maxFlats ? `Up to ${maxFlats} Flats` : grp.key.replace(/_/g, ' '));
          const flatSubtitle = PLAN_FLAT_SUBTITLES[maxFlats] ?? null;
          const sizeSubtitle = SIZE_SUBTITLES[maxFlats] ?? null;
          const isPopularPlan = maxFlats === 100;

          // Is this the plan the society is currently subscribed to?
          const isCurrentPlan = currentPlanId != null && (
            activePlan.id === currentPlanId ||
            grp.monthlyPlan?.id === currentPlanId ||
            grp.yearlyPlan?.id === currentPlanId
          );

          const isDisabled = isBusy;

          return (
            <div
              key={grp.key}
              className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-300 animate-slide-in-up ${
                isPopularPlan
                  ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-2xl scale-[1.02] hover:scale-[1.03]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:scale-[1.02] hover:border-emerald-300 dark:hover:border-emerald-600'
              }`}
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            >
              {/* Most Popular banner */}
              {isPopularPlan ? (
                <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2.5 tracking-widest uppercase">
                  Most Popular
                </div>
              ) : isCurrentPlan ? (
                <div className="bg-indigo-600 text-white text-xs font-bold text-center py-2.5 tracking-widest uppercase">
                  ✓ Current Plan
                </div>
              ) : (
                /* spacer so non-popular cards align with popular card's body */
                <div className="py-2.5 bg-transparent" />
              )}

              <div className="flex flex-col flex-1 px-6 pb-6 pt-4 gap-5">

                {/* Title + subtitles */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                  {flatSubtitle && (
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{flatSubtitle}</p>
                  )}
                  {sizeSubtitle && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">{sizeSubtitle}</p>
                  )}
                </div>

                {/* Price block */}
                <div className="space-y-1.5">
                  {billingCycle === 'yearly' && yearlyPrice > 0 ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                          ₹{yearlyPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-base font-medium">/year</span>
                      </div>
                      {perMonthEquiv > 0 && (
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          Only ₹{perMonthEquiv}/month
                        </p>
                      )}
                      {savePercent > 0 && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          Save {savePercent}%
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                          ₹{monthlyPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-base font-medium">/month</span>
                      </div>
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Save with yearly</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">₹{yearlyPrice.toLocaleString('en-IN')}</span>
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/year</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">(≈₹{perMonthEquiv}/month)</p>
                      </div>
                    </>
                  )}
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 pt-0.5">30 day free trial</p>
                </div>

                {/* Benefits list */}
                <ul className="space-y-2 flex-1">
                  {BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto pt-2">
                  {isCurrentPlan ? (
                    <>
                      <div className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-200 dark:border-indigo-800">
                        🔒 Your price is locked
                      </div>
                      <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                        You’re on this plan
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { if (!isDisabled) onChoosePlan(activePlan.id); }}
                        disabled={isDisabled}
                        className={`group w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900 ${
                          isBusy
                            ? 'bg-emerald-600 text-white opacity-70 cursor-wait'
                            : isPopularPlan
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]'
                              : 'border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-[0.99]'
                        }`}
                        aria-label={`Start Free Trial — ${title}`}
                      >
                        {isBusy ? 'Processing…' : 'Start Free Trial'}
                        {!isBusy && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />}
                      </button>

                    </>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ── Inline trust row ── */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2">
        {[
          'Choose the plan that matches your society size',
          'No setup fees',
          'No credit card required',
        ].map((item) => (
          <span key={item} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>

    </div>
  );
}

