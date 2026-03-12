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
import ReactApexChart from 'react-apexcharts';
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

// ─── Chart color palette ──────────────────────────────────────────────────────
const CHART_COLORS = ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#14B8A6', '#EC4899', '#3B82F6'];

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
      <div className="space-y-6" data-testid="dashboard-content">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl px-5 py-4 border border-[#E2E8F0] dark:border-slate-800" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0F172A] dark:text-white">
                Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
              </h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                Here's your society's financial overview
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
                        ? 'bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {periodTab === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input input-sm flex-1"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input input-sm flex-1"
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
                  color={(snap?.bank_balance ?? 0) >= 0 ? 'emerald' : 'red'}
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
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5">Monthly collection &amp; spending trend</p>
              {isLoading ? (
                <ChartSkeleton height={260} />
              ) : trends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[260px] gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No trend data yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Appears once billing is generated</p>
                  </div>
                </div>
              ) : (
                <ReactApexChart
                  type="bar"
                  height={260}
                  options={{
                    chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)', animations: { enabled: true, speed: 400 } },
                    plotOptions: { bar: { borderRadius: 5, columnWidth: '55%', borderRadiusApplication: 'end' } },
                    dataLabels: { enabled: false },
                    stroke: { show: true, width: 2, colors: ['transparent'] },
                    xaxis: {
                      categories: trends.slice(-6).map((t: any) => t.label),
                      axisBorder: { show: false },
                      axisTicks: { show: false },
                      labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
                    },
                    yaxis: {
                      labels: {
                        style: { colors: '#94a3b8', fontSize: '11px' },
                        formatter: (v: number) => `₹${(v / 1000).toFixed(0)}k`,
                      },
                    },
                    grid: { borderColor: '#F1F5F9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
                    fill: { opacity: 1 },
                    tooltip: {
                      y: { formatter: (v: number) => formatCurrency(v) },
                      theme: 'light',
                    },
                    legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', labels: { colors: '#64748b' } },
                    colors: ['#10B981', '#EF4444'],
                  }}
                  series={[
                    { name: 'Income', data: trends.slice(-6).map((t: any) => t.income ?? 0) },
                    { name: 'Expense', data: trends.slice(-6).map((t: any) => t.expense ?? 0) },
                  ]}
                />
              )}
            </Card>

            {/* Flat Occupancy */}
            <OccupancyCard flats={flats} loading={flatsLoading} />
          </div>

          {/* ── Bottom Row: Pie + Dues + Activity ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Expense Breakdown Donut */}
            <Card className="p-6 rounded-2xl shadow-sm" data-testid="expense-pie-chart">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Where Money Was Spent</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">Expense breakdown by category</p>
              {isLoading ? (
                <ChartSkeleton height={220} />
              ) : expBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[220px] gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <ArrowDownCircle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No expenses yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add expenses to see the breakdown</p>
                  </div>
                </div>
              ) : (
                <div>
                  <ReactApexChart
                    type="donut"
                    height={200}
                    options={{
                      chart: { background: 'transparent', fontFamily: 'var(--font-sans)', animations: { speed: 400 } },
                      labels: expBreakdown.map((e: any) => e.category),
                      colors: CHART_COLORS,
                      plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', formatter: () => formatCurrency(expBreakdown.reduce((s: number, e: any) => s + e.amount, 0)) } } } } },
                      dataLabels: { enabled: false },
                      legend: { show: false },
                      stroke: { width: 2 },
                      tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                    }}
                    series={expBreakdown.map((e: any) => e.amount)}
                  />
                  <ul className="w-full mt-3 space-y-2">
                    {expBreakdown.slice(0, 5).map((item: any, i: number) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
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
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">Flats with large outstanding balances</p>
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
                    className="mt-4 w-full text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
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
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">Latest payments &amp; expenses</p>
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
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-0.5"
                    >
                      Payments <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => navigate('/expenses')}
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-0.5"
                    >
                      Expenses <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </Card>
          </div>

      </div>
    </DashboardLayout>
  );
}
