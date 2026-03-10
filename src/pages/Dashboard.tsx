import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  AlertCircle,
  TrendingUp,
  Landmark,
  ArrowDownCircle,
  ReceiptText,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { SubscriptionSummary } from '../components/SubscriptionSummary';
import SetupBanner from '../components/dashboard/SetupBanner';
import { useSetupProgress } from '../hooks/useSetupProgress';
import { SETUP_REDIRECTED_KEY } from './Setup';
import WelcomeModal, { WELCOME_MODAL_SEEN_KEY } from '../components/setup/WelcomeModal';
import Card from '../components/ui/Card';
import { KpiCard } from '../components/dashboard/KpiCard';
import { OccupancyCard } from '../components/dashboard/OccupancyCard';
import { ActivityItem } from '../components/dashboard/ActivityItem';
import { useDashboard } from '../hooks/useDashboard';
import { useFlats } from '../hooks/useFlats';
import { useAuth } from '../contexts/AuthProvider';
import { useBillingStatus, useGenerateBilling } from '../hooks/useBillingStatus';
import BillingReminderBanner from '../components/dashboard/BillingReminderBanner';
import { useToast } from '../components/ui/Toast';
import { formatCurrency, cn } from '../lib/utils';

// ─── Pie chart palette ────────────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

// ─── Skeleton helpers ─────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

// ─── Period helpers ───────────────────────────────────────────────────────────
type PeriodTab = 'this-month' | 'last-month' | 'custom';

function getThisMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
  };
}

function getLastMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
    end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isComplete: setupComplete, isLoading: setupLoading, steps: setupSteps } = useSetupProgress();

  // Show welcome modal on first visit when setup is not yet complete
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return localStorage.getItem(WELCOME_MODAL_SEEN_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  // Auto-redirect brand-new users to the dedicated setup page (once only),
  // but wait until the welcome modal has been dismissed first.
  useEffect(() => {
    if (setupLoading) return; // wait for data before deciding
    if (showWelcome && !setupComplete) return; // show welcome modal first
    const alreadyRedirected = (() => {
      try { return sessionStorage.getItem(SETUP_REDIRECTED_KEY) === 'true'; } catch { return false; }
    })();
    if (!alreadyRedirected && !setupComplete && setupSteps.length > 0) {
      navigate('/setup', { replace: true });
    }
  }, [setupComplete, setupLoading, setupSteps, navigate, showWelcome]);

  const [periodTab, setPeriodTab] = useState<PeriodTab>('this-month');
  const [startDate, setStartDate] = useState(() => getThisMonthRange().start);
  const [endDate, setEndDate] = useState(() => getThisMonthRange().end);

  const handlePeriodTab = (tab: PeriodTab) => {
    setPeriodTab(tab);
    if (tab === 'this-month') {
      const r = getThisMonthRange();
      setStartDate(r.start);
      setEndDate(r.end);
    } else if (tab === 'last-month') {
      const r = getLastMonthRange();
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };

  const { data: dashboardData, isLoading } = useDashboard(
    startDate && endDate ? { startDate, endDate } : undefined
  );

  const { data: flats = [], isLoading: flatsLoading } = useFlats();

  const {
    data: billingStatus,
    isLoading: billingStatusLoading,
    refetch: refetchBillingStatus,
  } = useBillingStatus();
  const generateBilling = useGenerateBilling();

  const zeroAmountFlatsCount = useMemo(
    () => !billingStatus?.isGenerated ? (flats as any[]).filter(f => !f.maintenanceAmount || f.maintenanceAmount === 0).length : 0,
    [flats, billingStatus?.isGenerated]
  );

  const billingMonthLabel = useMemo(() => {
    const period = billingStatus?.currentMonth;
    if (!period) return 'Current Month';
    const [year, month] = period.split('-').map(Number);
    if (!year || !month) return period;
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [billingStatus?.currentMonth]);

  const handleGenerateBilling = async () => {
    if (!billingStatus?.currentMonth) {
      showToast('Billing month unavailable. Please refresh and try again.', 'error');
      return;
    }
    try {
      const result = await generateBilling.mutateAsync({ period: billingStatus.currentMonth });
      showToast(result.message || `Bills generated successfully (${result.generatedCount})`, 'success');
      await refetchBillingStatus();
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 409) { showToast('Bills already generated.', 'warning'); await refetchBillingStatus(); return; }
      if (status === 400) { showToast(message || 'Invalid billing request.', 'error'); return; }
      if (status === 500) { showToast('Unable to generate bills right now.', 'error'); return; }
      showToast(message || 'Failed to generate bills. Please try again.', 'error');
    }
  };

  const snap = dashboardData?.snapshot;
  const trends = dashboardData?.trends ?? [];
  const expBreakdown = dashboardData?.expense_breakdown ?? [];
  const topDefaulters = dashboardData?.top_defaulters ?? [];
  const recentActivity = dashboardData?.recent_activity ?? [];

  const collectionRate = snap?.collection_rate ?? 0;
  const collectionColor = collectionRate >= 80 ? 'green' : collectionRate >= 50 ? 'amber' : 'red' as any;

  return (
    <DashboardLayout title="Dashboard">
      {showWelcome && !setupComplete && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6" data-testid="dashboard-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl px-5 py-4 shadow-sm border border-slate-200 dark:border-slate-800">
            {/* Top row: greeting + subscription + period tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Welcome back, {user?.name || 'User'}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Society's financial overview</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Subscription compact badge */}
                <SubscriptionSummary compact />
                {/* Period Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
                  {([
                    { key: 'this-month', label: 'This Month' },
                    { key: 'last-month', label: 'Last Month' },
                    { key: 'custom',     label: 'Custom' },
                  ] as { key: PeriodTab; label: string }[]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handlePeriodTab(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap',
                        periodTab === key
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Custom date range — inline below, only when needed */}
            {periodTab === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Contextual Banners ────────────────────────────────────────── */}
          <SetupBanner />
          <BillingReminderBanner
            monthLabel={billingMonthLabel}
            isGenerated={!!billingStatus?.isGenerated}
            isLoading={billingStatusLoading}
            isGenerating={generateBilling.isPending}
            zeroAmountFlatsCount={zeroAmountFlatsCount}
            onGenerate={handleGenerateBilling}
          />

          {/* ── 4 KPI Cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
            ) : (
              <>
                <KpiCard
                  label="Maintenance Collected"
                  value={formatCurrency(snap?.total_collected ?? 0)}
                  icon={IndianRupee}
                  color={collectionColor}
                  sub={`${collectionRate.toFixed(1)}% collection rate`}
                  progress={collectionRate}
                  progressLabel={`of ₹${((snap?.total_billed ?? 0) / 100000).toFixed(1)}L`}
                />
                <KpiCard
                  label="Total Outstanding Dues"
                  value={formatCurrency(snap?.total_member_outstanding ?? 0)}
                  icon={AlertCircle}
                  color={(snap?.total_member_outstanding ?? 0) > 0 ? 'red' : 'emerald'}
                  sub="Current unpaid dues across all flats"
                />
                <KpiCard
                  label="Society Expenses"
                  value={formatCurrency(snap?.total_expense ?? 0)}
                  icon={ReceiptText}
                  color="orange"
                  sub="Total spending this period"
                />
                <KpiCard
                  label="Society Fund Balance"
                  value={formatCurrency(snap?.bank_balance ?? 0)}
                  icon={Landmark}
                  color={(snap?.bank_balance ?? 0) >= 0 ? 'indigo' : 'red'}
                  sub={
                    (snap?.net_cash_flow ?? 0) >= 0
                      ? `+${formatCurrency(snap?.net_cash_flow ?? 0)} net this period`
                      : `${formatCurrency(snap?.net_cash_flow ?? 0)} net this period`
                  }
                />
              </>
            )}
          </div>

          {/* ── Charts + Occupancy ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Bar Chart — Income vs Expense */}
            <Card className="lg:col-span-2 p-6 rounded-2xl shadow-sm" data-testid="income-expense-chart">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">6-Month Income vs Expense</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Monthly collection &amp; spending trend</p>
              {isLoading ? (
                <ChartSkeleton height={260} />
              ) : trends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[260px] gap-2 text-center">
                  <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">No trend data yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Appears once billing is generated</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trends.slice(-6)} barGap={3} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', padding: '10px 14px' }}
                      formatter={(value: any) => [formatCurrency(Number(value ?? 0)), '']}
                      cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} iconType="circle" iconSize={8} />
                    <Bar dataKey="income" fill="#22c55e" radius={[5, 5, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[5, 5, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Flat Occupancy */}
            <OccupancyCard flats={flats} loading={flatsLoading} />
          </div>

          {/* ── Bottom Row: Pie + Dues + Activity ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Expense Breakdown Pie */}
            <Card className="p-6 rounded-2xl shadow-sm" data-testid="expense-pie-chart">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Where Money Was Spent</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Expense breakdown by category</p>
              {isLoading ? (
                <ChartSkeleton height={220} />
              ) : expBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[220px] gap-2 text-center">
                  <ArrowDownCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">No expenses yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Add expenses to see the breakdown</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={expBreakdown as any}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {expBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [formatCurrency(Number(value ?? 0)), name ?? '']}
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="w-full mt-3 space-y-2">
                    {expBreakdown.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {item.category}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 pl-2 tabular-nums">{item.percentage.toFixed(1)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Highest Pending Dues */}
            <Card className="p-6 rounded-2xl shadow-sm" data-testid="top-defaulters">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Highest Pending Dues</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Flats with large outstanding balances</p>
              {isLoading ? (
                <ListSkeleton rows={5} />
              ) : topDefaulters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-center gap-3">
                  <span className="text-3xl">🎉</span>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">No outstanding balances</p>
                  <p className="text-xs text-slate-400">All members are up to date</p>
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {topDefaulters.map((d, i) => {
                      const isTop = i === 0;
                      return (
                        <li
                          key={d.flat_no}
                          onClick={() => navigate('/maintenance')}
                          className={cn(
                            'flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 group',
                            isTop
                              ? 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40'
                              : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/70'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn(
                              'flex-shrink-0 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center',
                              isTop ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                            )}>{i + 1}</span>
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">Flat {d.flat_no}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={cn('text-sm font-semibold tabular-nums', isTop ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400')}>
                              {formatCurrency(d.outstanding)}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    onClick={() => navigate('/maintenance')}
                    className="mt-4 w-full text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
                  >
                    View all outstanding dues <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </Card>

            {/* Recent Transactions */}
            <Card className="p-6 rounded-2xl shadow-sm" data-testid="recent-activity">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Latest payments &amp; expenses</p>
              {isLoading ? (
                <ListSkeleton rows={6} />
              ) : recentActivity.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-slate-400 dark:text-slate-500 text-sm">
                  No recent transactions
                </div>
              ) : (
                <>
                  <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800" style={{ maxHeight: 260 }}>
                    {recentActivity.map((item, i) => (
                      <ActivityItem
                        key={i}
                        type={item.type}
                        description={item.type === 'payment' ? `Flat ${item.description}` : item.description}
                        amount={item.amount}
                        date={item.date}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => navigate('/maintenance')}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      Payments <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => navigate('/expenses')}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      Expenses <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </Card>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
