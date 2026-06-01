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
  'Maintenance billing',
  'Expense tracking',
  'Payment recording',
  'Defaulter tracking',
  'Dashboard & reports',
  'Data export',
];

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

    plans.filter((p) => p.isActive !== false).forEach((p) => {
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
        const plan = grp.yearlyPlan ?? grp.monthlyPlan;
        return plan != null;
      })
      .sort((a, b) => a.minOrder - b.minOrder),
    [groups],
  );

  // ── Loading / error states ──────────────────────────────────────────────────

  if (plansLoading) {
    // Show skeleton cards for loading state
    return (
      <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full py-16">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md animate-pulse p-8 gap-4">
            <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
            <div className="h-4 w-1/4 bg-slate-100 dark:bg-slate-700 rounded mb-4" />
            <div className="h-10 w-1/2 bg-slate-100 dark:bg-slate-800 rounded mb-4" />
            <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
            <div className="h-10 w-full bg-emerald-100 dark:bg-emerald-900/20 rounded mt-4" />
          </div>
        ))}
      </div>
    );
  }

  // If error, show static fallback pricing (never show error message)
  if (plansError) {
    // Static fallback for two plans
    const fallbackPlans = [
      {
        key: 'basic',
        title: 'Basic',
        flatLimit: 'Up to 25 Flats',
        subtitle: 'Perfect for small apartment societies up to 25 flats',
        monthly: 199,
        yearly: 1990,
        savings: 398,
        features: [
          'Maintenance billing',
          'Expense tracking',
          'Payment recording',
          'Defaulter tracking',
          'Dashboard & reports',
          'Data export',
        ],
      },
      {
        key: 'standard',
        title: 'Standard',
        flatLimit: 'Up to 50 Flats',
        subtitle: 'For societies that have outgrown 25 flats',
        monthly: 299,
        yearly: 2990,
        savings: 598,
        features: [
          'Maintenance billing',
          'Expense tracking',
          'Payment recording',
          'Defaulter tracking',
          'Dashboard & reports',
          'Data export',
        ],
      },
    ];
    return (
      <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full">
        {fallbackPlans.map((plan) => (
          <div key={plan.key} className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-300 ${plan.key === 'standard' ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-2xl scale-[1.02]' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md'}`}>
            {plan.key === 'standard' ? (
              <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2.5 tracking-widest uppercase">Most Popular</div>
            ) : (
              <div className="py-2.5 bg-transparent" />
            )}
            <div className="flex flex-col flex-1 px-6 pb-6 pt-4 gap-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.title}</h3>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{plan.flatLimit}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{plan.subtitle}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₹{plan.monthly}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-base font-medium">/month</span>
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ₹{plan.yearly}/year · Save ₹{plan.savings}
                </p>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 pt-0.5">30 day free trial</p>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => onChoosePlan(plan.key)}
                  className={`group w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]`}
                  aria-label={`Start Free Trial — ${plan.title}`}
                >
                  Start Free 30-Day Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>
        ))}
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
            Yearly <span className="ml-1 text-xs font-bold opacity-80">(2 months free)</span>
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

          const monthlyPrice  = Number(grp.monthlyPlan?.price ?? 0);
          const yearlyPrice   = Number(grp.yearlyPlan?.price ?? 0);

          const annualSavings = monthlyPrice * 12 - yearlyPrice;
          const YEARLY_SAVINGS: Record<string, string> = {
            basic: annualSavings > 0 ? `Save ₹${annualSavings.toLocaleString('en-IN')}/year` : '',
            standard: annualSavings > 0 ? `Save ₹${annualSavings.toLocaleString('en-IN')}/year` : '',
          };

          const title        = activePlan.name.replace(/ - (Monthly|Yearly)$/i, '');
          const yearlySavingsLabel = YEARLY_SAVINGS[title.toLowerCase()] ?? null;
          const flatSubtitle = maxFlats ? `Up to ${maxFlats} Flats` : null;
          const sizeSubtitle = activePlan.description ?? null;
          const isPopularPlan = grp.isPopular;

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
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{sizeSubtitle}</p>
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
                      {yearlySavingsLabel && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {yearlySavingsLabel}
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
                      {yearlyPrice > 0 && annualSavings > 0 && (
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          ₹{yearlyPrice.toLocaleString('en-IN')}/year · Save ₹{annualSavings.toLocaleString('en-IN')}
                        </p>
                      )}
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

