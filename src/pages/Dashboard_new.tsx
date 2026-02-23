import { useMemo, useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Home, AlertCircle, FileText, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { SubscriptionSummary } from '../components/SubscriptionSummary';
import OpeningBalanceAlert from '../components/OpeningBalance/OpeningBalanceAlert';
import SetupProgressWidget from '../components/OpeningBalance/SetupProgressWidget';
import OnboardingWizard from '../components/OpeningBalance/OnboardingWizard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../contexts/AuthProvider';

export default function Dashboard() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const societyId = user?.societyId ? Number(user.societyId) : undefined;
  
  const { data: dashboardData, isLoading } = useDashboard(
    societyId,
    startDate && endDate ? { startDate, endDate } : undefined
  );

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
        title: 'Total Flats', 
        value: `${stats.total_flats}`, 
        subtitle: `${stats.paid_flats_count} paid this month`, 
        icon: Home,
        trend: stats.total_flats > 0 ? '+' : '0',
        color: 'blue'
      },
      { 
        title: 'Total Collected', 
        value: `₹${stats.total_collection.toLocaleString()}`, 
        subtitle: `${stats.collection_rate.toFixed(1)}% collection rate`,
        icon: DollarSign,
        trend: stats.total_collection > 0 ? '+' : '0',
        color: 'green'
      },
      { 
        title: 'Outstanding', 
        value: `₹${stats.outstanding_amount.toLocaleString()}`, 
        subtitle: `${stats.total_flats - stats.paid_flats_count} pending payments`,
        icon: AlertCircle,
        trend: stats.outstanding_amount > 0 ? '−' : '0',
        color: 'orange'
      },
      { 
        title: 'Collection Rate', 
        value: `${stats.collection_rate.toFixed(1)}%`, 
        subtitle: `Expected: ₹${stats.expected_collection.toLocaleString()}`,
        icon: TrendingUp,
        trend: stats.collection_rate >= 70 ? 'Good' : 'Improve',
        color: stats.collection_rate >= 70 ? 'emerald' : 'red'
      },
    ];
  }, [dashboardData]);

  const chartData = useMemo(() => {
    return dashboardData?.monthly || [];
  }, [dashboardData]);

  const recentActivity = useMemo(() => {
    if (!dashboardData?.recent_activity) return [];
    
    return dashboardData.recent_activity.map((activity, index) => ({
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
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getColorClasses = (color: string) => {
    const colorMap: {[key: string]: {icon: string, border: string, bg: string}} = {
      blue: { icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/30', bg: 'bg-blue-50/50 dark:bg-blue-950/20' },
      green: { icon: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/30', bg: 'bg-green-50/50 dark:bg-green-950/20' },
      orange: { icon: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900/30', bg: 'bg-orange-50/50 dark:bg-orange-950/20' },
      emerald: { icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/30', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
      red: { icon: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-900/30', bg: 'bg-red-50/50 dark:bg-red-950/20' },
    };
    return colorMap[color] || colorMap['blue'];
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 pb-24" data-testid="dashboard-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Welcome back, {user?.name || 'User'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 opacity-80 mt-1">
                Here's your society's financial overview
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              size="md" 
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              data-testid="date-picker-toggle"
              className="transition-all duration-200"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {startDate && endDate ? `${new Date(startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Select Date'}
            </Button>
          </div>
        </div>

        {showDatePicker && (
          <Card className="p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex gap-3">
                <Button size="md" onClick={() => setShowDatePicker(false)}>
                  Apply
                </Button>
                <Button size="md" variant="outline" onClick={handleDateReset}>
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        )}

        <SubscriptionSummary />

        <Card className="p-6 space-y-4 rounded-2xl">
          <SetupProgressWidget />
          <OpeningBalanceAlert />
          <OnboardingWizard />
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const colorClasses = getColorClasses(stat.color);
            return (
              <Card
                key={index}
                className="relative overflow-hidden rounded-2xl border-l-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950"
                style={{ borderLeftColor: `var(--${stat.color}-500, currentColor)` }}
                data-testid={`stat-card-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 opacity-70 mb-2">
                      {stat.title}
                    </p>
                    <p className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 opacity-60">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${colorClasses.bg} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-6 h-6 ${colorClasses.icon}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-6" data-testid="income-expense-chart">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Income vs Expense
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 opacity-80 mt-1">
                Monthly financial performance overview
              </p>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number | undefined) => value !== undefined ? `₹${value.toLocaleString()}` : '₹0'}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="income" fill="#16a34a" radius={[8, 8, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#dc2626" radius={[8, 8, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-slate-500 dark:text-slate-400">
                No data available
              </div>
            )}
          </Card>

          <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-6" data-testid="recent-activity">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 opacity-80 mt-1">
                Latest transactions
              </p>
            </div>
            {recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          activity.type === 'payment'
                            ? 'bg-green-50 dark:bg-green-950/30'
                            : activity.type === 'expense'
                            ? 'bg-red-50 dark:bg-red-950/30'
                            : 'bg-blue-50 dark:bg-blue-950/30'
                        }`}
                      >
                        <FileText
                          className={`w-5 h-5 ${
                            activity.type === 'payment'
                              ? 'text-green-600 dark:text-green-400'
                              : activity.type === 'expense'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 opacity-70 mt-0.5">
                          {'userName' in activity && activity.userName ? `${activity.userName} • ` : ''}{formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                    {activity.amount !== 0 && (
                      <span
                        className={`text-sm font-bold shrink-0 ${
                          activity.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {activity.amount > 0 ? '+' : ''}₹{Math.abs(activity.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-slate-600 dark:text-slate-400 opacity-70">
                No recent activity
              </div>
            )}
          </Card>
        </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
