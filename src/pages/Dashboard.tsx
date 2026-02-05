import { useMemo, useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Home, AlertCircle, Plus, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

export default function Dashboard() {
  const [user, setUser] = useState<{ name?: string }>({});

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  const stats = useMemo(() => [
    { title: 'Total Collection', value: '₹12,50,000', change: '+12%', positive: true, icon: DollarSign },
    { title: 'Outstanding Dues', value: '₹4,50,000', change: '-8%', positive: true, icon: AlertCircle },
    { title: 'Total Flats', value: '120', change: '+4', positive: true, icon: Home },
    { title: 'Collection Rate', value: '85%', change: '+3%', positive: true, icon: TrendingUp },
  ], []);

  const chartData = useMemo(() => [
    { month: 'Jul', income: 185000, expense: 65000 },
    { month: 'Aug', income: 195000, expense: 72000 },
    { month: 'Sep', income: 188000, expense: 58000 },
    { month: 'Oct', income: 210000, expense: 82000 },
    { month: 'Nov', income: 225000, expense: 55000 },
    { month: 'Dec', income: 247000, expense: 48000 },
  ], []);

  const expenseData = useMemo(() => [
    { name: 'Maintenance', value: 380000, color: '#6366f1' },
    { name: 'Utilities', value: 220000, color: '#0ea5e9' },
    { name: 'Security', value: 180000, color: '#22c55e' },
    { name: 'Other', value: 85000, color: '#f59e0b' },
  ], []);

  const recentActivity = useMemo(() => [
    { id: 1, type: 'payment', description: 'A-101 Maintenance Payment', amount: 5000, status: 'completed' },
    { id: 2, type: 'expense', description: 'Electricity Bill', amount: -8500, status: 'pending' },
    { id: 3, type: 'payment', description: 'B-205 Maintenance Payment', amount: 4500, status: 'completed' },
    { id: 4, type: 'bill', description: 'January 2025 Bills Generated', amount: 0, status: 'completed' },
    { id: 5, type: 'expense', description: 'Security Staff Salary', amount: -45000, status: 'completed' },
  ], []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6" data-testid="dashboard-content">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Welcome back, {user?.name || 'User'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Here's your society's financial overview
            </p>
          </div>
          <Button size="md" data-testid="quick-action-btn">
            <Plus className="w-4 h-4" />
            Quick Action
          </Button>
        </div>

        {/* Subscription Summary */}
        <SubscriptionSummary />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="stat-card" data-testid={`stat-card-${index}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className={`badge ${stat.positive ? 'badge-success' : 'badge-error'}`}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <p className="stat-label">{stat.title}</p>
              <p className="stat-value mt-1">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Income vs Expense Chart */}
          <Card data-testid="income-expense-chart">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Income vs Expense
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => `₹${(value / 100000).toFixed(1)}L`}
                />
                <Legend />
                <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Collection Trend Chart */}
          <Card data-testid="collection-trend-chart">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Collection Trend
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => `₹${(value / 100000).toFixed(1)}L`}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Expense Breakdown */}
          <Card data-testid="expense-breakdown">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Expense Breakdown
            </h3>
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
                    ₹{(item.value / 100000).toFixed(1)}L
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2" data-testid="recent-activity">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </h3>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </a>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        activity.type === 'payment'
                          ? 'bg-success-100 dark:bg-success-900/30'
                          : activity.type === 'expense'
                            ? 'bg-error-100 dark:bg-error-900/30'
                            : 'bg-info-100 dark:bg-info-900/30'
                      }`}
                    >
                      <FileText
                        className={`w-4 h-4 ${
                          activity.type === 'payment'
                            ? 'text-success-600'
                            : activity.type === 'expense'
                              ? 'text-error-600'
                              : 'text-info-600'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-500">Today</p>
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
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Generate Bills', desc: 'Create monthly maintenance bills', icon: FileText },
            { title: 'Record Payment', desc: 'Add new payment entry', icon: DollarSign },
            { title: 'Add Expense', desc: 'Record society expenses', icon: AlertCircle },
          ].map((action, i) => (
            <Card
              key={i}
              interactive
              className="text-left"
              data-testid={`quick-action-card-${i}`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3">
                <action.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white">{action.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
