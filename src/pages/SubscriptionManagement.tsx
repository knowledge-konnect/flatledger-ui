"use client"

import { useState } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Calendar, Crown,
  RefreshCw, Mail, CreditCard, Building2, IndianRupee,
  BarChart3, Users, Receipt, ClipboardList, PieChart, Settings2,
  Zap, ShieldCheck, Sparkles, FileDown, Lock,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { useSubscription } from '../hooks/useSubscription';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { usePlans } from '../hooks/usePlans';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { cn, formatCurrency } from '../lib/utils';

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

export default function SubscriptionManagement() {
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const navigate = useNavigate();
  const {
    accessAllowed,
    status,
    trialDaysRemaining,
    planName,
    monthlyAmount,
    trialEnd,
    loading,
    error,
    createTrial,
    cancelSubscription,
    refreshStatus,
    clearError,
  } = useSubscription();

  const { plans } = usePlans();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { isLoading: isPaymentLoading, isProcessing, initiatePayment } = useRazorpayPayment(
    () => {
      setPaymentError(null);
      refreshStatus().then(() => {
        showToast('Payment successful! Your subscription is now active.', 'success');
        navigate('/dashboard');
      });
    },
    (err?: string) => setPaymentError(err || null),
  );

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try { await refreshStatus(); } finally { setIsRefreshing(false); }
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
  const monthlyPlan = plans.find(p => p.name === 'Monthly');
  const yearlyPlan  = plans.find(p => p.name === 'Yearly');

  // Auto-select yearly (best value) once plans load
  const resolvedSelectedId = selectedPlanId ?? yearlyPlan?.id ?? monthlyPlan?.id ?? null;
  const resolvedSelectedPlan = plans.find(p => p.id === resolvedSelectedId) ?? null;

  const handleSubscribe = async () => {
    if (!resolvedSelectedPlan) return;
    try {
      await initiatePayment(resolvedSelectedPlan.id);
    } catch (err: any) {
      setPaymentError('Something went wrong. Please contact support.');
      showErrorToast({ ok: false, message: 'Something went wrong. Please contact support.' });
    }
  };

  return (
    <DashboardLayout title="Subscription">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">


          {/* ── Error banners ─────────────────────────────────────────────── */}
          {(error || paymentError) && (
            <Alert variant="error">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{paymentError || error}</AlertDescription>
              <Button variant="ghost" size="sm" onClick={() => { clearError(); setPaymentError(null); }} className="ml-auto">✕</Button>
            </Alert>
          )}

          {/* ── Status hero card ──────────────────────────────────────────── */}
          <div className={cn('rounded-2xl bg-gradient-to-br p-6 text-white shadow-xl relative overflow-hidden', cfg.gradient)}>
            {/* decorative blobs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

            {/* Top row — status badge + refresh + access denied pill */}
            <div className="relative flex items-center justify-between gap-3 flex-wrap">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', cfg.badge)}>
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
              <div className="flex items-center gap-2">
                {!accessAllowed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/30 text-red-100">
                    <XCircle className="w-3.5 h-3.5" /> Access Denied
                  </span>
                )}
                <button
                  onClick={handleRefreshStatus}
                  disabled={loading || isRefreshing}
                  title="Refresh status"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-60 border border-white/20"
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
              {monthlyAmount ? (
                <p className="text-white/75 text-sm mt-1">
                  {formatCurrency(monthlyAmount)} / {planName === 'Yearly' ? 'year' : 'month'}
                </p>
              ) : status === 'trial' ? (
                <p className="text-white/75 text-sm mt-1">Free — no credit card required</p>
              ) : null}
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
            {(status === null || status === 'active') && (
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
            {showCancelConfirm && (
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

          {/* ── Upgrade CTA — show for trial / expired / cancelled ─────────── */}
          {(status === 'trial' || status === 'expired' || status === 'cancelled' || status === null) && (
            <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Upgrade now</p>
                  <h3 className="text-xl font-bold text-emerald-950 dark:text-emerald-50">
                    {status === 'trial' ? `Lock in your plan before trial ends` : 'Reactivate your subscription'}
                  </h3>
                  <p className="text-sm text-emerald-700/80 dark:text-emerald-200/80">All features, no restrictions. Cancel anytime.</p>
                </div>
                <Crown className="w-10 h-10 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              </div>

              {/* Plan selector cards */}
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                {[monthlyPlan, yearlyPlan].filter(Boolean).map((plan) => {
                  if (!plan) return null;
                  const isSelected = resolvedSelectedId === plan.id;
                  const isYearly = plan.name === 'Yearly';
                  const saving = monthlyPlan && yearlyPlan
                    ? (monthlyPlan.monthlyAmount * 12) - yearlyPlan.monthlyAmount
                    : null;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        'relative rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md'
                          : 'border-emerald-200 dark:border-emerald-900 hover:border-emerald-400 dark:hover:border-emerald-700 bg-white/90 dark:bg-emerald-950/20'
                      )}
                    >
                      {/* Plan name + badge + radio */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{plan.name}</p>
                          {isYearly && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                              BEST VALUE · 2 MONTHS FREE
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all',
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-emerald-300 dark:border-emerald-700'
                        )}>
                          {isSelected && <span className="block w-full h-full rounded-full scale-50 bg-white" />}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                        {formatCurrency(plan.monthlyAmount)}
                        <span className="text-sm font-normal text-emerald-700/80 dark:text-emerald-200/80">
                          {isYearly ? ' / year' : ' / month'}
                        </span>
                      </p>
                      {isYearly && saving && monthlyPlan && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                          ≈ ₹{Math.round(plan.monthlyAmount / 12)}/mo · saves ₹{saving}
                        </p>
                      )}
                      {!isYearly && (
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80 mt-1">Billed monthly · cancel anytime</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Single pay button */}
              <button
                onClick={handleSubscribe}
                disabled={loading || isPaymentLoading || isProcessing || !resolvedSelectedPlan}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {isPaymentLoading || isProcessing
                  ? 'Processing...'
                  : resolvedSelectedPlan
                    ? `Subscribe — ${formatCurrency(resolvedSelectedPlan.monthlyAmount)} / ${resolvedSelectedPlan.name === 'Yearly' ? 'year' : 'month'}`
                    : 'Select a plan'}
              </button>

              <p className="mt-2 text-center text-xs text-emerald-700/70 dark:text-emerald-200/70">
                Secure payment via Razorpay · UPI, cards, net banking accepted
              </p>
            </div>
          )}

          {/* ── Included features ─────────────────────────────────────────── */}
          <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-emerald-950 dark:text-emerald-50">Everything included in your plan</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLAN_FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-emerald-900/90 dark:text-emerald-100/90">{label}</span>
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
              href="mailto:support@FlatLedger.com"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Mail className="w-4 h-4" />
              support@FlatLedger.com
            </a>
            <p className="text-xs text-emerald-700/70 dark:text-emerald-200/70 mt-1">We reply within 24 hours on business days.</p>
          </div>

      </div>
    </DashboardLayout>
  );
}
