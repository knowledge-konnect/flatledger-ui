import { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Home,
  AlertCircle,
  Calendar,
  TrendingDown,
  Landmark,
  ReceiptText,
  CreditCard,
  ArrowDownCircle,
  Users,
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
import OpeningBalanceAlert from '../components/OpeningBalance/OpeningBalanceAlert';
import SetupProgressWidget from '../components/OpeningBalance/SetupProgressWidget';
import OnboardingWizard from '../components/OpeningBalance/OnboardingWizard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { KpiCard } from '../components/dashboard/KpiCard';
import { ActivityItem } from '../components/dashboard/ActivityItem';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../contexts/AuthProvider';
import { useBillingStatus, useGenerateBilling } from '../hooks/useBillingStatus';
import BillingReminderBanner from '../components/dashboard/BillingReminderBanner';
import BillingStatusCard from '../components/dashboard/BillingStatusCard';
import { useToast } from '../components/ui/Toast';
import { formatCurrency } from '../lib/utils';
import { useMemo } from 'react';

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

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize to current month immediately — single query on mount, no double-fetch
  const getMonthRange = () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
    };
  };
  const [startDate, setStartDate] = useState(() => getMonthRange().start);
  const [endDate, setEndDate] = useState(() => getMonthRange().end);

  const { data: dashboardData, isLoading } = useDashboard(
    startDate && endDate ? { startDate, endDate } : undefined
  );

  const {
    data: billingStatus,
    isLoading: billingStatusLoading,
    refetch: refetchBillingStatus,
  } = useBillingStatus();
  const generateBilling = useGenerateBilling();

  const handleDateReset = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

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

  // Only warn when society has flats but zero bills for the period — not for empty periods
  const showNoBillsBanner = !isLoading && (snap?.total_flats ?? 0) > 0 && snap?.total_billed === 0;

  return (
    <DashboardLayout title="Dashboard">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6" data-testid="dashboard-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Welcome back, {user?.name || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Here's your society's financial overview
              </p>
            </div>
            <Button
              size="md"
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              data-testid="date-picker-toggle"
              className="transition-all duration-200"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {startDate && endDate
                ? new Date(startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : 'Select Date'}
            </Button>
          </div>

          {/* ── Date Range Picker ─────────────────────────────────────────────── */}
          {showDatePicker && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
                </div>
                <div className="flex gap-3">
                  <Button size="md" onClick={() => setShowDatePicker(false)}>Apply</Button>
                  <Button size="md" variant="outline" onClick={handleDateReset}>Reset</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Contextual Widgets ────────────────────────────────────────────── */}
          <SubscriptionSummary />
          <BillingReminderBanner
            monthLabel={billingMonthLabel}
            isGenerated={!!billingStatus?.isGenerated}
            isLoading={billingStatusLoading}
            isGenerating={generateBilling.isPending}
            onGenerate={handleGenerateBilling}
          />
          <OpeningBalanceAlert />
          <SetupProgressWidget />
          <OnboardingWizard />

          {/* ── No Bills Banner ──────────────────────────────────────────────── */}
          {showNoBillsBanner && (
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                No bills generated for this period. Generate billing to see collection data.
              </p>
            </div>
          )}

          {/* ── Executive Snapshot KPIs — Row 1 ─────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
            ) : (
              <>
                <KpiCard
                  label="Total Billed"
                  value={formatCurrency(snap?.total_billed ?? 0)}
                  icon={ReceiptText}
                  color="blue"
                  sub={`${snap?.total_flats ?? 0} flats`}
                />
                <KpiCard
                  label="Total Collected"
                  value={formatCurrency(snap?.total_collected ?? 0)}
                  icon={DollarSign}
                  color="green"
                />
                <KpiCard
                  label="Collection Rate"
                  value={`${(snap?.collection_rate ?? 0).toFixed(1)}%`}
                  icon={TrendingUp}
                  color={(snap?.collection_rate ?? 0) >= 70 ? 'emerald' : 'red'}
                  sub={(snap?.collection_rate ?? 0) >= 70 ? 'On track' : 'Needs attention'}
                />
                <KpiCard
                  label="Net Cash Flow"
                  value={formatCurrency(snap?.net_cash_flow ?? 0)}
                  icon={(snap?.net_cash_flow ?? 0) >= 0 ? TrendingUp : TrendingDown}
                  color={(snap?.net_cash_flow ?? 0) >= 0 ? 'green' : 'red'}
                />
              </>
            )}
          </div>

          {/* ── Executive Snapshot KPIs — Row 2 + Billing Status ─────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
            ) : (
              <>
                <KpiCard
                  label="Bill Outstanding"
                  value={formatCurrency(snap?.bill_outstanding ?? 0)}
                  icon={AlertCircle}
                  color={(snap?.bill_outstanding ?? 0) > 0 ? 'red' : 'emerald'}
                  sub="Current period unpaid"
                />
                <KpiCard
                  label="Opening Dues Remaining"
                  value={formatCurrency(snap?.opening_dues_remaining ?? 0)}
                  icon={Home}
                  color="amber"
                  sub="From migration"
                />
                <KpiCard
                  label="Total Member Outstanding"
                  value={formatCurrency(snap?.total_member_outstanding ?? 0)}
                  icon={Users}
                  color="orange"
                  sub="Bills + Opening dues"
                />
                <KpiCard
                  label="Bank Balance"
                  value={formatCurrency(snap?.bank_balance ?? 0)}
                  icon={Landmark}
                  color="indigo"
                />
              </>
            )}
          </div>

          {/* ── Charts Section ────────────────────────────────────────────────── */}
          {(!isLoading && trends.length > 0) || isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Income vs Expense Bar Chart */}
              <Card
                className="lg:col-span-2 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-6"
                data-testid="income-expense-chart"
              >
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Income vs Expense</h3>
                  <p className="text-xs text-muted-foreground mt-1">Last 6 months financial performance</p>
                </div>
                {isLoading ? (
                  <ChartSkeleton height={280} />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={trends.slice(-6)} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                      <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [formatCurrency(Number(value ?? 0)), '']}
                      />
                      <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" iconSize={8} />
                      <Bar dataKey="income" fill="#16a34a" radius={[6, 6, 0, 0]} name="Income" />
                      <Bar dataKey="expense" fill="#dc2626" radius={[6, 6, 0, 0]} name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Expense Breakdown Pie */}
              {(!isLoading && expBreakdown.length > 0) || isLoading ? (
                <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-6" data-testid="expense-pie-chart">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Expense Breakdown</h3>
                    <p className="text-xs text-muted-foreground mt-1">By category</p>
                  </div>
                  {isLoading ? (
                    <ChartSkeleton height={280} />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={expBreakdown}
                            dataKey="amount"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ percent }) => percent && percent > 0.03 ? `${(percent * 100).toFixed(0)}%` : ''}
                            labelLine={false}
                          >
                            {expBreakdown.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any, name: any) => [formatCurrency(Number(value ?? 0)), name ?? '']}
                            contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Legend */}
                      <ul className="w-full mt-2 space-y-1.5">
                        {expBreakdown.map((item, i) => (
                          <li key={i} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                              />
                              {item.category}
                            </span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 pl-2">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ) : null}
            </div>
          ) : null}

          {/* ── Risk Panel + Recent Activity ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Top Outstanding Flats */}
            <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-6" data-testid="top-defaulters">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Top Outstanding Flats</h3>
                <p className="text-xs text-muted-foreground mt-1">Highest pending balances</p>
              </div>
              {isLoading ? (
                <ListSkeleton rows={5} />
              ) : topDefaulters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                  <span className="text-3xl">🎉</span>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">No outstanding balances</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">All members are up to date</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {topDefaulters.map((d, i) => {
                    const isHighest = i === 0;
                    return (
                      <li
                        key={d.flat_no}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                          isHighest
                            ? 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'
                            : 'bg-slate-50 dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`flex-shrink-0 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                            isHighest ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            Flat {d.flat_no}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold flex-shrink-0 pl-2 ${
                          isHighest ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {formatCurrency(d.outstanding)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Recent Activity Feed */}
            <Card className="lg:col-span-2 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-6" data-testid="recent-activity">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                  <p className="text-xs text-muted-foreground mt-1">Latest payments & expenses</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><ArrowDownCircle className="w-3.5 h-3.5 text-green-500" /> Payment</span>
                  <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-red-500" /> Expense</span>
                </div>
              </div>
              {isLoading ? (
                <ListSkeleton rows={6} />
              ) : recentActivity.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-slate-400 dark:text-slate-500 text-sm">
                  No recent activity
                </div>
              ) : (
                <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentActivity.map((item, i) => (
                      <ActivityItem
                        key={i}
                        type={item.type}
                        description={
                          item.type === 'payment'
                            ? `Flat ${item.description} — Payment`
                            : item.description
                        }
                        amount={item.amount}
                        date={item.date}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ── Billing Status Card ───────────────────────────────────────────── */}
          <BillingStatusCard
            monthLabel={billingMonthLabel}
            isGenerated={!!billingStatus?.isGenerated}
            generatedCount={billingStatus?.generatedCount || 0}
            isLoading={billingStatusLoading}
          />

        </div>
      </div>
    </DashboardLayout>
  );
}
