import { useMemo, useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Home, AlertCircle, Plus, FileText, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
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
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useDashboard } from '../hooks/api/useDashboard';
import { useAuth } from '../contexts/AuthProvider';

export default function Dashboard() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const societyId = user?.societyId ? Number(user.societyId) : undefined;
  
  // Fetch dashboard data with optional date range
  const { data: dashboardData, isLoading } = useDashboard(
    societyId,
    startDate && endDate ? { startDate, endDate } : undefined
  );

  // Set default to current month on mount
  useEffect(() => {
    if (!startDate && !endDate) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  }, [startDate, endDate]);

  const handleDateReset = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  const stats = useMemo(() => {
    if (!dashboardData?.stats) return [];
    
    const { stats } = dashboardData;
    return [
      { 
        title: 'Total Collection', 
        value: `₹${stats.total_collection.toLocaleString()}`, 
        change: stats.collection_change_percent > 0 ? `+${stats.collection_change_percent}%` : `${stats.collection_change_percent}%`, 
        positive: stats.collection_change_percent >= 0, 
        icon: DollarSign 
      },
      { 
        title: 'Outstanding Amount', 
        value: `₹${stats.outstanding_amount.toLocaleString()}`, 
        change: `${stats.paid_flats_count}/${stats.total_flats} paid`, 
        positive: stats.collection_rate > 70, 
        icon: AlertCircle 
      },
      { 
        title: 'Total Flats', 
        value: `${stats.total_flats}`, 
        change: `${stats.paid_flats_count} paid`, 
        positive: true, 
        icon: Home 
      },
      { 
        title: 'Collection Rate', 
        value: `${stats.collection_rate.toFixed(1)}%`, 
        change: `Expected: ₹${stats.expected_collection.toLocaleString()}`, 
        positive: stats.collection_rate >= 70, 
        icon: TrendingUp 
      },
    ];
  }, [dashboardData]);

  const chartData = useMemo(() => {
    return dashboardData?.monthly || [];
  }, [dashboardData]);

  const expenseData = useMemo(() => {
    if (!dashboardData?.expense_breakdown) return [];
    // Blue Slate chart palette: blue, slate, amber, green, red, violet
    const colors = ['#2563EB', '#64748B', '#F59E42', '#22C55E', '#EF4444', '#8B5CF6'];
    return dashboardData.expense_breakdown.map((item, index) => ({
      name: item.category,
      value: item.amount,
      percentage: item.percentage,
      color: colors[index % colors.length],
    }));
  }, [dashboardData]);

  const recentActivity = useMemo(() => {
    if (!dashboardData?.recent_activity) return [];
    
    return dashboardData.recent_activity.slice(0, 5).map((activity, index) => ({
      id: index,
      type: activity.type,
      description: activity.type === 'payment' ? `Flat ${activity.description} Payment` : activity.description,
      amount: activity.amount,
      status: 'completed',
      date: activity.date,
    }));
  }, [dashboardData]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-10 md:space-y-14 bg-gradient-to-b from-white via-teal-50/60 to-emerald-50/60 dark:from-slate-900 dark:via-teal-950/60 dark:to-emerald-950/60 min-h-screen py-4 md:py-8 px-2 md:px-6 rounded-xl" data-testid="dashboard-content">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-gradient-to-r from-teal-50/90 via-white/90 to-emerald-50/90 dark:from-teal-900/80 dark:via-slate-900/60 dark:to-emerald-900/80 rounded-3xl p-8 shadow-md border border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
              Welcome back, {user?.name || 'User'}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 mt-2">
              Here’s your society’s financial overview
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              size="md" 
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              data-testid="date-picker-toggle"
              className="border-slate-200 bg-white/90 hover:bg-teal-50/80 dark:bg-slate-900/70 dark:border-slate-800 transition-colors focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-700"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {startDate && endDate ? `${new Date(startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Select Date'}
            </Button>
          </div>
        </div>

        {/* Date Range Picker */}
        {showDatePicker && (
          <Card className="p-6 bg-white/95 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 shadow-lg rounded-2xl">
            <div className="flex flex-col sm:flex-row gap-6 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300/80 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-700"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300/80 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-700"
                />
              </div>
              <div className="flex gap-3">
                <Button size="md" onClick={() => setShowDatePicker(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-400 dark:hover:bg-emerald-500 dark:text-slate-900 font-semibold rounded-lg shadow">
                  Apply
                </Button>
                <Button size="md" variant="outline" onClick={handleDateReset} className="border-slate-200 dark:border-slate-700 font-semibold rounded-lg">
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Subscription Summary */}
        <div className="pt-2">
          <SubscriptionSummary />
        </div>

        {/* Stats Grid */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 pl-1 tracking-tight">Key Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="stat-card border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white/95 via-teal-50/90 to-emerald-50/80 dark:from-teal-900/80 dark:via-slate-900/70 dark:to-emerald-900/80 shadow-lg hover:shadow-xl transition-shadow duration-200 group relative overflow-hidden rounded-2xl p-5"
                data-testid={`stat-card-${index}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/90 dark:bg-emerald-400 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                    <stat.icon className="w-6 h-6 text-white dark:text-emerald-900" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${stat.positive ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'} shadow-sm border border-transparent`}> 
                    {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className="stat-label text-slate-600 dark:text-slate-300 font-semibold">{stat.title}</p>
                <p className="stat-value mt-1 text-2xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">{stat.value}</p>
                <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <stat.icon className={
                    `w-16 h-16 ` +
                    (stat.title === 'Total Collection' ? 'text-blue-400 dark:text-blue-700' :
                     stat.title === 'Outstanding Amount' ? 'text-amber-300 dark:text-amber-600' :
                     stat.title === 'Total Flats' ? 'text-slate-300 dark:text-slate-600' :
                     stat.title === 'Collection Rate' ? 'text-green-300 dark:text-green-600' :
                     'text-slate-400')
                  } />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-8">
          <h3 className="col-span-full text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 pl-1">Trends</h3>
          {/* Income vs Expense Chart */}
          <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/70 shadow-sm" data-testid="income-expense-chart">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Income vs Expense
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #0f172a',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number | undefined) => value !== undefined ? `₹${value.toLocaleString()}` : '₹0'}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="#64748B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-slate-500 dark:text-slate-400">
                No data available
              </div>
            )}
          </Card>

          {/* Collection Trend Chart */}
          <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/70 shadow-sm" data-testid="collection-trend-chart">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Collection Trend
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #0f172a',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number | undefined) => value !== undefined ? `₹${value.toLocaleString()}` : '₹0'}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ fill: '#2563EB', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-slate-500 dark:text-slate-400">
                No data available
              </div>
            )}
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <h3 className="col-span-full text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 pl-1">Breakdown & Activity</h3>
          {/* Expense Breakdown */}
          <Card className="border border-slate-200/70 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/80 shadow-lg rounded-2xl" data-testid="expense-breakdown">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Expense Breakdown
            </h3>
            {expenseData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {expenseData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        ₹{item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-slate-500 dark:text-slate-400">
                No expense data
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 border border-slate-200/70 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/80 shadow-lg rounded-2xl" data-testid="recent-activity">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          activity.type === 'payment'
                            ? 'bg-success-100 dark:bg-success-900/30'
                            : 'bg-error-100 dark:bg-error-900/30'
                        }`}
                      >
                        <FileText
                          className={`w-4 h-4 ${
                            activity.type === 'payment'
                              ? 'text-success-600'
                              : 'text-error-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-slate-500">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                    {activity.amount !== 0 && (
                      <span
                        className={`text-sm font-medium ${
                          activity.amount > 0 ? 'text-success-600' : 'text-error-600'
                        }`}
                      >
                        {activity.amount > 0 ? '+' : ''}₹{Math.abs(activity.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-slate-500 dark:text-slate-400">
                No recent activity
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 pl-1 tracking-tight">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Generate Bills', desc: 'Create monthly maintenance bills', icon: FileText },
              { title: 'Record Payment', desc: 'Add new payment entry', icon: DollarSign },
              { title: 'Add Expense', desc: 'Record society expenses', icon: AlertCircle },
            ].map((action, i) => (
              <Card
                key={i}
                interactive
                className="text-left border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white/95 via-teal-50/90 to-emerald-50/80 dark:from-teal-900/80 dark:via-slate-900/70 dark:to-emerald-900/80 shadow-lg hover:shadow-xl transition-shadow duration-200 group rounded-2xl p-5"
                data-testid={`quick-action-card-${i}`}
              >
                <div className={
                  `w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow group-hover:scale-105 transition-transform ` +
                  (i === 0 ? 'bg-blue-600/90 dark:bg-blue-400' :
                   i === 1 ? 'bg-green-500/90 dark:bg-green-400' :
                   i === 2 ? 'bg-amber-400/90 dark:bg-amber-300' :
                   'bg-slate-400')
                }>
                  <action.icon className="w-6 h-6 text-white dark:text-slate-900" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-base">{action.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


