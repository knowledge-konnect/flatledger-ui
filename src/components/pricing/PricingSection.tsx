import { useState } from 'react';
import { CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { usePlans } from '../../hooks/usePlans';
import {
  usePlanGroups,
  pickPlanForCycle,
  resolvePlanDisplay,
  yearlySavingsLabel,
} from '../../hooks/usePlanGroups';

interface PricingSectionProps {
  onChoosePlan: (planId: string) => void;
  isBusy?: boolean;
  currentPlanId?: string | null;
}

const BENEFITS = [
  'Maintenance billing',
  'Expense tracking',
  'Payment recording',
  'Defaulter tracking',
  'Dashboard & reports',
  'Data export',
];

function BillingToggle({
  billingCycle,
  setBillingCycle,
  yearlyLabel,
}: {
  billingCycle: 'monthly' | 'yearly';
  setBillingCycle: (v: 'monthly' | 'yearly') => void;
  yearlyLabel: string;
}) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex rounded-full p-1.5 bg-slate-50 dark:bg-[#0B2A24] border border-slate-300 dark:border-[rgba(52,211,153,.15)] shadow-sm">
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
          Yearly <span className="ml-1 text-xs font-bold opacity-80">({yearlyLabel})</span>
        </button>
      </div>
    </div>
  );
}

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
  chooseDisabled = false,
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
  chooseDisabled?: boolean;
}) {
  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-[rgba(52,211,153,.15)] bg-white dark:bg-[#0B2A24] shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,.25)] hover:shadow-xl dark:hover:shadow-[0_8px_30px_rgba(0,0,0,.25)] hover:border-emerald-400 dark:hover:border-[rgba(52,211,153,.3)] dark:hover:bg-[#10352D] hover:-translate-y-1 transform transition-all duration-200 animate-slide-in-up"
      style={{ animationDelay }}
    >
      {isCurrentPlan ? (
        <div className="bg-emerald-700 text-white text-xs font-bold text-center py-2.5 tracking-widest uppercase flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Current Plan
        </div>
      ) : (
        <div className="py-2.5" />
      )}

      <div className="flex flex-col flex-1 px-6 pb-6 pt-4 gap-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          {sizeLabel && (
            <p className="text-xs text-gray-400 dark:text-[#6e9688] mt-0.5">{sizeLabel}</p>
          )}
        </div>

        <div className="space-y-1.5">
          {billingCycle === 'yearly' && yearlyPrice > 0 ? (
            <>
              {(() => {
                const monthlyEquivalent = Math.round(yearlyPrice / 12);
                return (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-black tracking-tight text-slate-800 dark:text-white">
                        ₹{monthlyEquivalent.toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-500 dark:text-[#6e9688] text-base font-medium">/month</span>
                    </div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      ₹{yearlyPrice.toLocaleString('en-IN')} billed annually · Save ₹{annualSavings.toLocaleString('en-IN')}
                    </p>
                  </>
                );
              })()}
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

        <div className="mt-auto pt-2">
          {isCurrentPlan ? (
            <>
              <div className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-800">
                <Lock className="w-4 h-4" />
                Your price is locked
              </div>
              <p className="text-center text-xs font-medium text-slate-500 dark:text-[#6e9688] mt-1.5">
                You're on this plan
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={onChoose}
              disabled={isBusy || chooseDisabled}
              className={`group w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg active:scale-[0.99] ${
                isBusy || chooseDisabled ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              aria-label={`Start 30-Day Free Trial — ${title}`}
            >
              {chooseDisabled ? 'Unavailable' : isBusy ? 'Processing…' : 'Start 30-Day Free Trial'}
              {!isBusy && !chooseDisabled && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PricingSection({
  onChoosePlan,
  isBusy = false,
  currentPlanId = null,
}: PricingSectionProps) {
  const { plans, plansLoading, plansError } = usePlans();
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('monthly');
  const visibleGroups = usePlanGroups(plans);
  const savingsLabel = yearlySavingsLabel(visibleGroups);

  if (plansLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full py-16">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col rounded-2xl border border-slate-200 dark:border-[rgba(52,211,153,.15)] bg-white dark:bg-[#0B2A24] shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,.25)] animate-pulse p-8 gap-4">
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

  if (plansError) {
    const fallback = [
      { key: 'basic', title: 'Up to 25 Flats', sizeLabel: 'Small societies', monthly: 199, yearly: 1990, savings: 398 },
      { key: 'standard', title: 'Up to 50 Flats', sizeLabel: 'Medium societies', monthly: 299, yearly: 2990, savings: 598 },
    ];

    return (
      <div className="space-y-6">
        <p className="text-center text-sm text-red-600 dark:text-red-400 font-medium">
          Could not load live plans. Showing reference pricing — please refresh to subscribe.
        </p>
        <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} yearlyLabel="17% off" />
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
              onChoose={() => {}}
              chooseDisabled
              animationDelay={`${0.1 * (i + 1)}s`}
            />
          ))}
        </div>
        <TrustRow />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} yearlyLabel={savingsLabel} />

      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm text-slate-600 dark:text-[#a8c5ba] mb-3">All plans include</p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 justify-center max-w-2xl mx-auto">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0B2A24] border border-slate-300 dark:border-emerald-700/20 rounded-xl px-3.5 py-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full">
        {visibleGroups.map((grp, index) => {
          const activePlan = pickPlanForCycle(grp, billingCycle);
          if (!activePlan) return null;

          const monthlyPrice = Number(grp.monthlyPlan?.price ?? 0);
          const yearlyPrice = Number(grp.yearlyPlan?.price ?? 0);
          const annualSavings = monthlyPrice * 12 - yearlyPrice;
          const { title, sizeLabel } = resolvePlanDisplay(activePlan, grp.key);

          const isCurrentPlan = currentPlanId != null && (
            activePlan.id === currentPlanId ||
            grp.monthlyPlan?.id === currentPlanId ||
            grp.yearlyPlan?.id === currentPlanId
          );

          return (
            <PlanCard
              key={grp.key}
              title={title}
              sizeLabel={sizeLabel}
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
