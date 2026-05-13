import { useState, useMemo } from 'react';
import { CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const TRUST_BADGES = [
  'No setup cost',
  'Cancel anytime',
  'No credit card required',
];

/** Display name prefix keyed by maxFlats */
const PLAN_DISPLAY_NAMES: Record<number, string> = {
  50: 'Starter',
  100: 'Growth',
};

/** Subtitle shown under the plan title, keyed by maxFlats */
const SIZE_SUBTITLES: Record<number, string> = {
  25: 'Ideal for small societies',
  50: 'Ideal for small societies',
  100: 'Best for growing communities',
};

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your plan anytime with no questions asked.',
  },
  {
    q: 'Do I need a credit card to start?',
    a: 'No. The free trial requires no credit card at all.',
  },
  {
    q: 'Can I change my plan later?',
    a: 'Yes, you can upgrade or downgrade your plan anytime.',
  },
] as const;

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
        aria-expanded={open}
      >
        {q}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 pt-1 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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

      {/* ── Trust badges ── */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {TRUST_BADGES.map((badge) => (
          <span key={badge} className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {badge}
          </span>
        ))}
      </div>

      {/* ── Plan cards ── */}
      <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full">
        {groups.map((grp, index) => {
          const activePlan = grp.monthlyPlan ?? grp.yearlyPlan;

          if (!activePlan) return null;

          const price    = Number(activePlan.price ?? 0);
          const maxFlats = Number(activePlan.maxFlats ?? 0);
          const prefix   = PLAN_DISPLAY_NAMES[maxFlats];
          const title    = prefix
            ? `${prefix} (Up to ${maxFlats} Flats)`
            : maxFlats ? `Up to ${maxFlats} Flats` : grp.key.replace(/_/g, ' ');
          const sizeSubtitle = SIZE_SUBTITLES[maxFlats] ?? null;

          // Is this the plan the society is currently subscribed to?
          const isCurrentPlan = currentPlanId != null && (
            activePlan.id === currentPlanId ||
            grp.monthlyPlan?.id === currentPlanId ||
            grp.yearlyPlan?.id === currentPlanId
          );

          // Per-flat (display only) — do NOT use for pricing logic
          const perFlat = maxFlats > 0 ? (price / maxFlats).toFixed(1) : null;

          const isDisabled = isBusy;

          return (
            <div
              key={grp.key}
              className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-300 animate-slide-in-up ${
                grp.isPopular
                  ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-2xl scale-[1.02] hover:scale-[1.03]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:scale-[1.02] hover:border-emerald-300 dark:hover:border-emerald-600'
              }`}
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            >
              {/* Most Popular banner */}
              {grp.isPopular ? (
                <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2.5 tracking-widest uppercase">
                  ⭐ Most Popular
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

                {/* Title + size subtitle */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                  {sizeSubtitle && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                      {sizeSubtitle}
                    </p>
                  )}
                </div>

                {/* Price block */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      ₹{price}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-base font-medium">/month</span>
                  </div>
                  {perFlat && (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      (~₹{perFlat} per flat)
                    </p>
                  )}
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
                            : grp.isPopular
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]'
                              : 'border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-[0.99]'
                        }`}
                        aria-label={`Start Free Trial — ${title}`}
                      >
                        {isBusy ? 'Processing…' : 'Start Free Trial'}
                        {!isBusy && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />}
                      </button>
                      <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                        Takes less than 2 minutes
                      </p>
                      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
                        30-day free trial • No credit card • Cancel anytime
                      </p>
                    </>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ── Trust section ── */}
      <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
        30-day free trial · No credit card required · Cancel anytime
      </p>

      {/* ── Yearly teaser ── */}
      <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        💡 Save up to 20% with yearly plans{' '}
        <span className="text-slate-400 dark:text-slate-500">(coming soon)</span>
      </p>

      {/* ── FAQ ── */}
      <div className="max-w-2xl mx-auto w-full space-y-2">
        <p className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
          Frequently Asked Questions
        </p>
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>

    </div>
  );
}

