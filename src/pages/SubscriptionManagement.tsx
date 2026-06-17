﻿"use client"

import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Calendar,
  RefreshCw, Mail, CreditCard, Building2, IndianRupee,
  BarChart3, Users, Receipt, ClipboardList, PieChart, Settings2,
  Zap, ShieldCheck, Sparkles, FileDown,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { useSubscription } from '../hooks/useSubscription';
import { useCurrentSubscription } from '../hooks/useCurrentSubscription';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { usePlans } from '../hooks/usePlans';
import {
  usePlanGroups,
  pickPlanForCycle,
  resolvePlanDisplay,
  planBillingLabel,
  yearlySavingsLabel,
  type PlanGroup,
} from '../hooks/usePlanGroups';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthProvider';
import { isAdminRole, collectUserRoles } from '../types/roles';
import { SUPPORT_EMAIL } from '../config/branding';

const PLAN_FEATURES = [
  { icon: Building2,     label: 'Unlimited flats & residents' },
  { icon: IndianRupee,   label: 'Monthly billing generation' },
  { icon: Receipt,       label: 'Offline payment recording' },
  { icon: Zap,           label: 'Live KPI dashboard' },
  { icon: BarChart3,     label: 'Income vs expense charts' },
  { icon: ClipboardList, label: 'Expense tracking by category' },
  { icon: PieChart,      label: 'Defaulter & outstanding tracking' },
  { icon: Users,         label: 'Role-based team access' },
  { icon: Settings2,     label: 'Society & maintenance config' },
  { icon: FileDown,      label: 'CSV export for all data' },
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
    <div className="flex justify-center mb-5">
      <div className="inline-flex rounded-full p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {(['monthly', 'yearly'] as const).map((cycle) => (
          <button
            key={cycle}
            type="button"
            onClick={() => setBillingCycle(cycle)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize',
              billingCycle === cycle
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
            )}
          >
            {cycle === 'yearly' ? `Yearly (${yearlyLabel})` : 'Monthly'}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionManagement() {
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminRole(collectUserRoles(user));
  const {
    accessAllowed,
    status,
    trialDaysRemaining,
    planName,
    monthlyAmount,
    subscribedAmount: legacySubscribedAmount,
    trialEnd,
    loading,
    error,
    createTrial,
    cancelSubscription,
    refreshStatus,
    clearError,
  } = useSubscription();

  // Society-scoped subscription — source of truth for subscribedAmount / currentPeriodEnd
  // RULE: use currentSub.subscribedAmount for price display; never use plan.price for active subs
  const currentSub = useCurrentSubscription();
  const subscribedAmount = currentSub.subscribedAmount ?? legacySubscribedAmount ?? monthlyAmount;
  const currentPeriodEnd = currentSub.currentPeriodEnd;
  const durationMonths = currentSub.durationMonths ?? 1;
  const billingInterval = durationMonths === 12 ? 'year' : 'month';

  const { plans, plansLoading, plansError } = usePlans();
  const visibleGroups = usePlanGroups(plans);
  const savingsLabel = yearlySavingsLabel(visibleGroups);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { isLoading: isPaymentLoading, isProcessing, initiatePayment } = useRazorpayPayment(
    () => {
      setPaymentError(null);
      // Refresh both legacy and society-scoped subscription state after payment
      Promise.all([refreshStatus(), currentSub.refresh()]).then(() => {
        showToast('Payment successful! Your subscription is now active.', 'success');
        navigate('/dashboard');
      });
    },
    (err?: string) => setPaymentError(err || null),
  );

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try { await Promise.all([refreshStatus(), currentSub.refresh()]); } finally { setIsRefreshing(false); }
  };

  const handleCreateTrial = async () => {
    try {
      await createTrial();
    } catch (err: any) {
      const d = err?.response?.data;
      if (d) {
        showErrorToast({ ok: false, message: d.message || 'Failed to create trial', code: d.code, traceId: d.traceId });
      } else {
        showToast('Failed to create trial', 'error');
      }
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription('User requested cancellation');
      setShowCancelConfirm(false);
      showToast('Subscription cancelled. You can resubscribe anytime.', 'success');
    } catch (err: any) {
      const d = err?.response?.data;
      if (d) {
        showErrorToast({ ok: false, message: d.message || 'Failed to cancel subscription', code: d.code, traceId: d.traceId });
      } else {
        showToast('Failed to cancel subscription', 'error');
      }
    }
  };

  // ─── Status config ──────────────────────────────────────────────────────────
  const statusConfig = {
    active: {
      label: 'Active',
      gradient: 'from-emerald-500 to-teal-600',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    trial: {
      label: 'Free Trial',
      gradient: 'from-emerald-500 to-green-700',
      icon: Calendar,
      iconColor: 'text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    expired: {
      label: 'Expired',
      gradient: 'from-red-500 to-rose-600',
      icon: XCircle,
      iconColor: 'text-red-400',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    },
    cancelled: {
      label: 'Cancelled',
      gradient: 'from-slate-500 to-slate-600',
      icon: XCircle,
      iconColor: 'text-slate-400',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
  } as const;

  const cfg = statusConfig[status as keyof typeof statusConfig] ?? {
    label: 'Not Started',
    gradient: 'from-slate-400 to-slate-500',
    icon: AlertTriangle,
    iconColor: 'text-slate-400',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  const StatusIcon = cfg.icon;
  const trialProgress = trialDaysRemaining !== null ? Math.max(0, Math.min(100, (trialDaysRemaining / 30) * 100)) : null;
  const isExpiredState = status === 'expired';
  const isInactiveState = status === 'expired' || status === 'cancelled' || status === null;

  const resolvedSelectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  const pickSelectedPlan = (group: PlanGroup) => {
    const plan = pickPlanForCycle(group, billingCycle);
    if (plan) setSelectedPlanId(plan.id);
  };

  useEffect(() => {
    if (!selectedPlanId) return;
    const group = visibleGroups.find(
      (g) => g.monthlyPlan?.id === selectedPlanId || g.yearlyPlan?.id === selectedPlanId
    );
    if (!group) return;
    const plan = pickPlanForCycle(group, billingCycle);
    if (plan && plan.id !== selectedPlanId) setSelectedPlanId(plan.id);
  }, [billingCycle, visibleGroups, selectedPlanId]);

  const handlePlanChoose = async (planId?: string) => {
    if (!planId) return;
    await initiatePayment(planId);
  };
  return (
    <DashboardLayout title="Subscription">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">


          {/* ── Error banners ─────────────────────────────────────────────── */}
          {(error || paymentError) && (
            <Alert variant="error">
              <AlertDescription>{paymentError || error}</AlertDescription>
              <Button variant="ghost" size="sm" onClick={() => { clearError(); setPaymentError(null); }} className="ml-auto">✕</Button>
            </Alert>
          )}

          {/* ── No subscription warning ───────────────────────────────────── */}
          {status === null && !loading && (
            <Alert variant="warning">
              <AlertDescription>
                Your society has no active subscription. Start a free trial or subscribe to a plan to unlock all features.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Expired subscription warning ──────────────────────────────── */}
          {status === 'expired' && !loading && (
            <Alert variant="error" className="border-red-400/50 bg-red-50/90 dark:bg-red-950/30 dark:border-red-800/70">
              <AlertDescription>
                Subscription expired: some admin actions are locked. Reactivate below to restore full access instantly.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Expired action bar ───────────────────────────────────────────── */}
          {isAdmin && isExpiredState && !loading && (
            <div className="rounded-2xl border border-red-300/70 dark:border-red-900/70 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 dark:from-red-950/35 dark:via-red-950/20 dark:to-amber-950/25 p-4 sm:p-5 shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-600 dark:text-red-300">Action Required</p>
                <h3 className="text-lg font-bold text-red-950 dark:text-red-50">Restore subscription access</h3>
                <p className="text-sm text-red-900/80 dark:text-red-100/85">Choose a plan below and complete payment to unlock all modules for your society.</p>
              </div>
            </div>
          )}

          {/* ── Status hero card ──────────────────────────────────────────── */}
          <div className={cn(
            'rounded-2xl p-6 shadow-xl relative overflow-hidden',
            isExpiredState ? 'bg-white dark:bg-[#0f211c] border-2 border-red-300 dark:border-red-800/60 text-slate-900 dark:text-white' : cn('bg-gradient-to-br text-white', cfg.gradient)
          )}>
            {/* decorative blobs (hide in expired state to avoid messy styling on white bg) */}
            {!isExpiredState && (
              <>
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
              </>
            )}

            {/* Top row — status badge + refresh + access denied pill */}
            <div className="relative flex items-center justify-between gap-3 flex-wrap">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', cfg.badge)}>
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
              <div className="flex items-center gap-2">
                {!accessAllowed && (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                    isExpiredState ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-red-500/30 text-red-100"
                  )}>
                    <XCircle className="w-3.5 h-3.5" /> Access Denied
                  </span>
                )}
                <button
                  onClick={handleRefreshStatus}
                  disabled={loading || isRefreshing}
                  title="Refresh status"
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-60 border",
                    isExpiredState ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700" : "bg-white/15 hover:bg-white/25 text-white border-white/20"
                  )}
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                </button>
              </div>
            </div>

            {/* Plan name + price */}
            <div className="relative mt-4">
              <h3 className="text-3xl font-bold leading-tight">
                {planName ? `${planName} Plan` : status === 'trial' ? '30-Day Free Trial' : 'No Active Plan'}
              </h3>
              {subscribedAmount ? (
                <p className={cn("text-sm mt-1", isExpiredState ? "text-slate-600 dark:text-slate-400" : "text-white/75")}>
                  {formatCurrency(subscribedAmount)} / {status === 'active' ? billingInterval : 'month'}
                  {status === 'active' && (
                    <span className={cn("ml-2 text-xs", isExpiredState ? "text-slate-500" : "text-white/60")}>🔒 Your price is locked</span>
                  )}
                </p>
              ) : monthlyAmount ? (
                <p className={cn("text-sm mt-1", isExpiredState ? "text-slate-600 dark:text-slate-400" : "text-white/75")}>
                  {formatCurrency(monthlyAmount)} / {billingInterval}
                </p>
              ) : status === 'trial' ? (
                <p className={cn("text-sm mt-1", isExpiredState ? "text-slate-600 dark:text-slate-400" : "text-white/75")}>Free — no credit card required</p>
              ) : null}
              {/* Next billing date from society-scoped subscription */}
              {currentPeriodEnd && status === 'active' && (
                <p className={cn("text-xs mt-1", isExpiredState ? "text-slate-500" : "text-white/60")}>
                  Next billing: {new Date(currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Trial countdown bar */}
            {status === 'trial' && trialDaysRemaining !== null && (
              <div className="relative mt-4 px-4 py-3 rounded-xl bg-white/10 border border-white/20 flex items-center gap-4">
                {/* Big number */}
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-3xl font-extrabold tabular-nums leading-none">{trialDaysRemaining}</span>
                  <span className="text-xs font-medium text-white/70">days left</span>
                </div>

                {/* Progress bar + end date */}
                <div className="flex-1 min-w-0">
                  <div className="w-full h-1.5 rounded-full bg-white/20">
                    <div
                      className="h-1.5 rounded-full bg-white/90 transition-all duration-700 shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                      style={{ width: `${trialProgress}%` }}
                    />
                  </div>
                  {trialEnd && (
                    <p className="text-[11px] text-white/50 mt-1 truncate">
                      Ends {new Date(trialEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons — only when there's something to show */}
            {isAdmin && (status === null || status === 'active') && (
              <div className="relative mt-4 flex flex-wrap gap-2">
                {status === null && (
                  <button
                    onClick={handleCreateTrial}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-emerald-700 text-xs font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Start Free Trial
                  </button>
                )}
                {status === 'active' && !showCancelConfirm && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-red-500/40 text-white text-xs font-medium transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Plan
                  </button>
                )}
              </div>
            )}

            {/* Inline cancel confirmation */}
            {isAdmin && showCancelConfirm && (
              <div className="relative mt-4 p-4 rounded-xl bg-black/20 border border-white/30">
                <p className="text-sm text-white font-medium mb-3">Cancel your subscription?</p>
                <p className="text-xs text-white/70 mb-3">You'll keep access until the end of your billing period. You can resubscribe anytime.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Cancelling...' : 'Yes, cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
                  >
                    Keep plan
                  </button>
                </div>
              </div>
            )}
          </div>

          {isAdmin && (status === 'trial' || status === 'expired' || status === 'cancelled' || status === null) && (
            <div className={cn(
              'rounded-3xl border p-6 sm:p-8 shadow-sm overflow-hidden relative',
              isExpiredState
                ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:border-red-900/60 dark:from-red-950/30 dark:via-slate-950 dark:to-orange-950/20'
                : 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/60 dark:from-emerald-950/25 dark:via-slate-950 dark:to-teal-950/20'
            )}>
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-black/5 dark:bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full bg-black/5 dark:bg-white/5 pointer-events-none" />

              <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
                <div className="max-w-2xl space-y-2">
                  <p className={cn('text-xs font-bold uppercase tracking-[0.18em]', isExpiredState ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300')}>
                    {isExpiredState ? 'Subscription expired' : 'Choose a plan'}
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
                    {isExpiredState ? 'Restore access with a plan that fits your society' : 'Pick a plan for your society'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                    {isExpiredState
                      ? 'Your current access is paused. Select a plan below to reactivate immediately.'
                      : 'Plans are fetched live from the server, grouped like the landing page, and priced by the backend.'}
                  </p>
                </div>

                {resolvedSelectedPlan && (
                  <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur px-4 py-3 shadow-sm min-w-[220px]">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 font-bold">Selected plan</p>
                    <p className="text-base font-bold text-slate-950 dark:text-white mt-0.5">{resolvedSelectedPlan.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {formatCurrency(Number(resolvedSelectedPlan.price ?? resolvedSelectedPlan.monthlyAmount ?? 0))} / {planBillingLabel(resolvedSelectedPlan)}
                    </p>
                  </div>
                )}
              </div>

              <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} yearlyLabel={savingsLabel} />

              {plansLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-5 animate-pulse">
                      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
                      <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
                      <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
                      <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : plansError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200 p-4 text-sm">
                  {plansError}
                </div>
              ) : visibleGroups.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-5 text-sm text-slate-600 dark:text-slate-300">
                  No plans are available right now.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
                  {visibleGroups.map((group, index) => {
                    const activePlan = pickPlanForCycle(group, billingCycle);
                    if (!activePlan) return null;

                    const { title: displayTitle, sizeLabel: displaySubtitle } = resolvePlanDisplay(activePlan, group.key);
                    const displayPrice = Number(activePlan.price ?? activePlan.monthlyAmount ?? 0);
                    const priceLabel = planBillingLabel(activePlan);
                    const isSelected = selectedPlanId === activePlan.id
                      || (billingCycle === 'monthly' && selectedPlanId === group.monthlyPlan?.id)
                      || (billingCycle === 'yearly' && selectedPlanId === group.yearlyPlan?.id);
                   
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => pickSelectedPlan(group)}
                        className={cn(
                          'group relative text-left rounded-2xl border p-5 sm:p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                          isSelected
                            ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-lg shadow-emerald-100/40 dark:shadow-none'
                            : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5'
                        )}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl opacity-60 pointer-events-none bg-emerald-200/50 dark:bg-emerald-900/20" />
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className="relative flex items-start justify-between gap-3 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-lg font-bold text-slate-950 dark:text-white">{displayTitle}</h4>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{displaySubtitle ?? 'Recommended for societies like yours'}</p>
                          </div>
                        </div>

                        <div className="relative flex items-baseline gap-1.5 mb-3">
                          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                            {formatCurrency(displayPrice)}
                          </span>
                          <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">/{priceLabel}</span>
                        </div>

                        <div className="space-y-2 mb-5 text-sm text-slate-600 dark:text-slate-300">
                          {activePlan.maxFlats ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              Up to {activePlan.maxFlats} flats
                            </div>
                          ) : null}
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Cancel anytime
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Live billing and reports
                          </div>
                        </div>

                        <div className={cn(
                          'relative inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-transparent group-hover:border-emerald-500'
                        )}>
                          {isSelected ? 'Continue with this plan' : 'Tap to select'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="relative mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-950 dark:text-white">Need help choosing?</span>{' '}
                  Contact support and we’ll guide you to the right plan.
                </div>
                <button
                  onClick={() => selectedPlanId && void handlePlanChoose(selectedPlanId)}
                  disabled={!selectedPlanId || loading || isPaymentLoading || isProcessing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700"
                >
                  <CreditCard className="w-4 h-4" />
                  {isPaymentLoading || isProcessing ? 'Processing...' : isExpiredState ? 'Reactivate now' : 'Continue'}
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Secure payment via Razorpay · UPI, cards, net banking accepted
              </p>
            </div>
          )}

          {/* ── Included features ─────────────────────────────────────────── */}
          <div className={cn(
            'rounded-2xl p-6 shadow-sm border',
            isInactiveState
              ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
              : 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900'
          )}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className={cn('w-5 h-5', isInactiveState ? 'text-slate-600 dark:text-slate-300' : 'text-emerald-500')} />
              <h3 className={cn('font-semibold', isInactiveState ? 'text-slate-900 dark:text-slate-100' : 'text-emerald-950 dark:text-emerald-50')}>
                Everything included in your plan
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLAN_FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    isInactiveState ? 'bg-slate-200/70 dark:bg-slate-800/70' : 'bg-emerald-50 dark:bg-emerald-900/30'
                  )}>
                    <Icon className={cn('w-3.5 h-3.5', isInactiveState ? 'text-slate-600 dark:text-slate-300' : 'text-emerald-600 dark:text-emerald-400')} />
                  </div>
                  <span className={cn('text-sm', isInactiveState ? 'text-slate-800 dark:text-slate-200' : 'text-emerald-900/90 dark:text-emerald-100/90')}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment instructions ──────────────────────────────────────── */}
          {status !== 'active' && (
          <div className="rounded-2xl bg-white dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-emerald-950 dark:text-emerald-50">How billing works</h3>
            </div>
            <ol className="space-y-3">
              {[
                'Click "Subscribe" above — you\'ll be taken to the Razorpay secure checkout',
                'Pay via UPI, debit/credit card, or net banking',
                'Your subscription activates instantly after payment',
                'You can cancel anytime from this page — no lock-in',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-emerald-900/80 dark:text-emerald-100/80">{step}</span>
                </li>
              ))}
            </ol>
          </div>          )}
          {/* ── Support ───────────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-emerald-950 dark:text-emerald-50">Need help?</h3>
            </div>
            <p className="text-sm text-emerald-900/75 dark:text-emerald-100/80 mb-3">
              Having trouble with billing or your subscription? We're here to help.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Mail className="w-4 h-4" />
              {SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-emerald-700/70 dark:text-emerald-200/70 mt-1">We reply within 24 hours on business days.</p>
          </div>

      </div>
    </DashboardLayout>
  );
}
