import { useState, useMemo } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { usePlans, type Plan } from '../../hooks/usePlans';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanGroup {
  key: string;
  monthlyPlan: Plan | undefined;
  yearlyPlan: Plan | undefined;
  minOrder: number;
}

interface PricingSectionProps {
  onChoosePlan: (planId: string) => void;
  isBusy?: boolean;
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

const PLAN_META: Record<string, { flatLabel: string; sizeLabel: string }> = {
  basic:    { flatLabel: 'Up to 25 Flats', sizeLabel: 'Small societies' },
  standard: { flatLabel: 'Up to 50 Flats', sizeLabel: 'Medium societies' },
};

// ─── Billing toggle ───────────────────────────────────────────────────────────

function BillingToggle({
  billingCycle,
  setBillingCycle,
}: {
  billingCycle: 'monthly' | 'yearly';
  setBillingCycle: (v: 'monthly' | 'yearly') => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex rounded-full p-1.5 bg-slate-50 dark:bg-[#102722] border border-slate-300 dark:border-emerald-700/70 shadow-sm">
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            billingCycle === 'monthly'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-emerald-100 hover:text-emerald-700 dark:hover:text-emerald-300'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('yearly')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            billingCycle === 'yearly'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-emerald-100 hover:text-emerald-700 dark:hover:text-emerald-300'
          }`}
        >
          Yearly <span className="ml-1 text-xs font-bold opacity-80">(2 months free)</span>
        </button>
      </div>
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  title,
  sizeLabel,
  monthlyPrice,
  yearlyPrice,
  annualSavings,
  billingCycle,
  isCurrentPlan,
  isBusy,
  onChoose,
  animationDelay,
}: {
  title: string;
  sizeLabel: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  annualSavings: number;
  billingCycle: 'monthly' | 'yearly';
  isCurrentPlan: boolean;
  isBusy: boolean;
  onChoose: () => void;
  animationDelay: string;
}) {
  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#0f211c] shadow-md hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 animate-slide-in-up"
      style={{ animationDelay }}
    >
      {/* Top spacer — equal height on all cards, no badge */}
      {isCurrentPlan ? (
        <div className="bg-emerald-700 text-white text-xs font-bold text-center py-2.5 tracking-widest uppercase">
          ✓ Current Plan
        </div>
      ) : (
        <div className="py-2.5" />
      )}

      <div className="flex flex-col flex-1 px-6 pb-6 pt-4 gap-5">

        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          {sizeLabel && (
            <p className="text-xs text-gray-400 dark:text-[#6e9688] mt-0.5">{sizeLabel}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          {billingCycle === 'yearly' && yearlyPrice > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black tracking-tight text-slate-800 dark:text-white">
                  ₹{yearlyPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-500 dark:text-[#6e9688] text-base font-medium">/year</span>
              </div>
              {annualSavings > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Save ₹{annualSavings.toLocaleString('en-IN')}/year
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black tracking-tight text-slate-800 dark:text-white">
                  ₹{monthlyPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-500 dark:text-[#6e9688] text-base font-medium">/month</span>
              </div>
              {yearlyPrice > 0 && annualSavings > 0 && (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  ₹{yearlyPrice.toLocaleString('en-IN')}/year · Save ₹{annualSavings.toLocaleString('en-IN')}
                </p>
              )}
            </>
          )}
          <p className="text-xs font-medium text-slate-400 dark:text-[#6e9688] pt-0.5">30 day free trial</p>
        </div>

        {/* Benefits */}
        <ul className="space-y-2 flex-1">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-700 dark:text-[#a8c5ba]">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-auto pt-2">
          {isCurrentPlan ? (
            <>
              <div className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-800">
                🔒 Your price is locked
              </div>
              <p className="text-center text-xs font-medium text-slate-500 dark:text-[#6e9688] mt-1.5">
                You're on this plan
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={onChoose}
              disabled={isBusy}
              className={`group w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] ${
                isBusy ? 'opacity-70 cursor-wait' : ''
              }`}
              aria-label={`Start Free Trial — ${title}`}
            >
              {isBusy ? 'Processing…' : 'Start Free Trial'}
              {!isBusy && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PricingSection({
  onChoosePlan,
  isBusy = false,
  currentPlanId = null,
}: PricingSectionProps) {
  const { plans, plansLoading, plansError } = usePlans();
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('monthly');

  const groups = useMemo<PlanGroup[]>(() => {
    const map: Record<string, { monthly?: Plan; yearly?: Plan; minOrder: number }> = {};

    plans.filter((p) => p.isActive !== false).forEach((p) => {
      const key = p.planGroup ?? (p.maxFlats != null ? `flats_${p.maxFlats}` : p.id);
      if (!map[key]) map[key] = { minOrder: Infinity };

      const dur = Number(p.durationMonths);
      if (dur === 1)       map[key].monthly = p;
      else if (dur === 12) map[key].yearly  = p;

      map[key].minOrder = Math.min(map[key].minOrder, Number(p.displayOrder ?? 999));
    });

    return Object.entries(map)
      .sort(([, a], [, b]) => a.minOrder - b.minOrder)
      .map(([key, g]) => ({
        key,
        monthlyPlan: g.monthly,
        yearlyPlan:  g.yearly,
        minOrder:    g.minOrder,
      }));
  }, [plans]);

  const visibleGroups = useMemo(
    () => groups
      .filter((grp) => (grp.yearlyPlan ?? grp.monthlyPlan) != null)
      .sort((a, b) => a.minOrder - b.minOrder),
    [groups],
  );

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (plansLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full py-16">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col rounded-2xl border border-slate-200 dark:border-[#1a3a31] bg-white dark:bg-[#0f211c] shadow-md animate-pulse p-8 gap-4">
            <div className="h-6 w-1/3 bg-slate-200 dark:bg-[#163028] rounded" />
            <div className="h-4 w-1/4 bg-slate-100 dark:bg-[#163028] rounded" />
            <div className="h-10 w-1/2 bg-slate-100 dark:bg-[#163028] rounded" />
            <div className="h-4 w-2/3 bg-slate-100 dark:bg-[#163028] rounded" />
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-[#163028] rounded" />
            <div className="h-10 w-full bg-emerald-100 dark:bg-emerald-900/20 rounded mt-4" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error / static fallback ─────────────────────────────────────────────────

  if (plansError) {
    const fallback = [
      { key: 'basic',    title: 'Up to 25 Flats', sizeLabel: 'Small societies',  monthly: 199, yearly: 1990, savings: 398 },
      { key: 'standard', title: 'Up to 50 Flats', sizeLabel: 'Medium societies', monthly: 299, yearly: 2990, savings: 598 },
    ];

    return (
      <div className="space-y-6">
        <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />
        <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full">
          {fallback.map((plan, i) => (
            <PlanCard
              key={plan.key}
              title={plan.title}
              sizeLabel={plan.sizeLabel}
              monthlyPrice={plan.monthly}
              yearlyPrice={plan.yearly}
              annualSavings={plan.savings}
              billingCycle={billingCycle}
              isCurrentPlan={false}
              isBusy={isBusy}
              onChoose={() => onChoosePlan(plan.key)}
              animationDelay={`${0.1 * (i + 1)}s`}
            />
          ))}
        </div>
        <TrustRow />
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />

      <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full">
        {visibleGroups.map((grp, index) => {
          const maxFlats      = Number(grp.yearlyPlan?.maxFlats ?? grp.monthlyPlan?.maxFlats ?? 0);
          const activePlan    = billingCycle === 'yearly'
            ? (grp.yearlyPlan  ?? grp.monthlyPlan)
            : (grp.monthlyPlan ?? grp.yearlyPlan);

          if (!activePlan) return null;

          const monthlyPrice  = Number(grp.monthlyPlan?.price ?? 0);
          const yearlyPrice   = Number(grp.yearlyPlan?.price  ?? 0);
          const annualSavings = monthlyPrice * 12 - yearlyPrice;

          const rawTitle      = activePlan.name.replace(/ - (Monthly|Yearly)$/i, '');
          const planKey       = rawTitle.toLowerCase();
          const meta          = PLAN_META[planKey];

          const displayTitle     = meta?.flatLabel  ?? (maxFlats ? `Up to ${maxFlats} Flats` : rawTitle);
          const displaySizeLabel = meta?.sizeLabel  ?? activePlan.description ?? null;

          const isCurrentPlan = currentPlanId != null && (
            activePlan.id         === currentPlanId ||
            grp.monthlyPlan?.id   === currentPlanId ||
            grp.yearlyPlan?.id    === currentPlanId
          );

          return (
            <PlanCard
              key={grp.key}
              title={displayTitle}
              sizeLabel={displaySizeLabel}
              monthlyPrice={monthlyPrice}
              yearlyPrice={yearlyPrice}
              annualSavings={annualSavings}
              billingCycle={billingCycle}
              isCurrentPlan={isCurrentPlan}
              isBusy={isBusy}
              onChoose={() => { if (!isBusy) onChoosePlan(activePlan.id); }}
              animationDelay={`${0.1 * (index + 1)}s`}
            />
          );
        })}
      </div>

      <TrustRow />

    </div>
  );
}

// ─── Trust row ────────────────────────────────────────────────────────────────

function TrustRow() {
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2">
      {['No setup fees', 'No credit card required'].map((item) => (
        <span key={item} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-[#a8c5ba]">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          {item}
        </span>
      ))}
    </div>
  );
}
