import { useMemo, useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Home, AlertCircle, Plus, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
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
import { PremiumLayout } from '../components/layout/PremiumLayout';
import { SubscriptionSummary } from '../components/SubscriptionSummary';
import { cn } from '../lib/utils';

/**
 * Premium Dashboard with Modern Design
 * Features: Gradient cards, smooth animations, better spacing
 */
export default function PremiumDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
    }
  }, []);

  const stats = useMemo(
    () => [
      {
        title: 'Total Collection',
        value: '₹12,50,000',
        change: '+12%',
        positive: true,
        icon: DollarSign,
        gradient: 'from-emerald-500 to-emerald-600',
      },
      {
        title: 'Outstanding Dues',
        value: '₹4,50,000',
        change: '-8%',
        positive: true,
        icon: AlertCircle,
        gradient: 'from-amber-500 to-amber-600',
      },
      {
        title: 'Total Flats',
        value: '120',
        change: '+4',
        positive: true,
        icon: Home,
        gradient: 'from-primary-500 to-primary-600',
      },
      {
        title: 'Collection Rate',
        value: '85%',
        change: '+3%',
        positive: true,
        icon: TrendingUp,
        gradient: 'from-violet-500 to-violet-600',
      },
    ],
    []
  );

  const chartData = useMemo(
    () => [
      { month: 'Jul', income: 185000, expense: 65000 },
      { month: 'Aug', income: 195000, expense: 72000 },
      { month: 'Sep', income: 188000, expense: 58000 },
      { month: 'Oct', income: 210000, expense: 82000 },
      { month: 'Nov', income: 225000, expense: 55000 },
      { month: 'Dec', income: 247000, expense: 48000 },
    ],
    []
  );

  const expenseData = useMemo(
    () => [
      { name: 'Maintenance', value: 380000, color: '#8b5cf6' },
      { name: 'Utilities', value: 220000, color: '#0ea5e9' },
      { name: 'Security', value: 180000, color: '#10b981' },
      { name: 'Other', value: 85000, color: '#f59e0b' },
    ],
    []
  );

  const recentActivity = useMemo(
    () => [
      { id: 1, type: 'payment', description: 'A-101 Maintenance Payment', amount: 5000, status: 'completed' },
      { id: 2, type: 'expense', description: 'Electricity Bill', amount: -8500, status: 'pending' },
      { id: 3, type: 'payment', description: 'B-205 Maintenance Payment', amount: 4500, status: 'completed' },
      { id: 4, type: 'bill', description: 'January 2025 Bills Generated', amount: 0, status: 'completed' },
      { id: 5, type: 'expense', description: 'Security Staff Salary', amount: -45000, status: 'completed' },
    ],
    []
  );

  return (
    <PremiumLayout
      title={`Welcome back, ${user?.name || 'User'}! 👋`}
      subtitle="Here's what's happening with your society today"
      actions={
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Quick Action
        </button>
      }
    >
      <div className="space-y-8">
        {/* Subscription Banner */}
        <div className="animate-slide-in-up">
          <SubscriptionSummary />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card card-hover group animate-slide-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                {/* Icon & Change Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
                      'bg-gradient-to-br',
                      stat.gradient,
                      'group-hover:scale-110 transition-transform duration-300'
                    )}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={cn('badge', stat.positive ? 'badge-success' : 'badge-error')}>
                    {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Income vs Expense */}
          <div className="card animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
              Income vs Expense
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="month" stroke="currentColor" className="text-neutral-400" />
                <YAxis stroke="currentColor" className="text-neutral-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tw-bg-opacity)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(value?: number) => value !== undefined ? `₹${(value / 100000).toFixed(1)}L` : ''}
                />
                <Legend />
                <Bar dataKey="income" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#a78bfa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Collection Trend */}
          <div className="card animate-slide-in-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Collection Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="month" stroke="currentColor" className="text-neutral-400" />
                <YAxis stroke="currentColor" className="text-neutral-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tw-bg-opacity)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(value?: number) => value !== undefined ? `₹${(value / 100000).toFixed(1)}L` : ''}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Expense Breakdown */}
          <div className="card animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
              Expense Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 space-y-3">
              {expenseData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                  </div>
                  <span className="font-semibold text-neutral-900 dark:text-white font-mono">
                    ₹{(item.value / 100000).toFixed(1)}L
                  </span>
                </div>
              ))}\n            </div>
          </div>

          {/* Recent Activity */}
          <div className="card lg:col-span-2 animate-slide-in-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Recent Activity</h3>
              <a
                href="#"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors duration-200"
              >
                View All →
              </a>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 animate-slide-in-up"
                  style={{ animationDelay: `${0.4 + 0.05 * index}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        activity.type === 'payment'
                          ? 'bg-success-100 dark:bg-success-900/30'
                          : activity.type === 'expense'
                            ? 'bg-error-100 dark:bg-error-900/30'
                            : 'bg-info-100 dark:bg-info-900/30'
                      )}
                    >
                      <FileText
                        className={cn(
                          'w-5 h-5',
                          activity.type === 'payment'
                            ? 'text-success-600 dark:text-success-400'
                            : activity.type === 'expense'
                              ? 'text-error-600 dark:text-error-400'
                              : 'text-info-600 dark:text-info-400'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                        {activity.description}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Today</p>
                    </div>
                  </div>
                  {activity.amount !== 0 && (
                    <span
                      className={cn(
                        'font-semibold text-sm font-mono',
                        activity.amount > 0
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-error-600 dark:text-error-400'
                      )}
                    >
                      {activity.amount > 0 && '+'}₹{Math.abs(activity.amount).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[
            {
              title: 'Generate Bills',
              desc: 'Create monthly maintenance bills',
              icon: FileText,
              gradient: 'from-primary-500 to-primary-600',
            },
            {
              title: 'Record Payment',
              desc: 'Add new payment entry',
              icon: DollarSign,
              gradient: 'from-success-500 to-success-600',
            },
            {
              title: 'Add Expense',
              desc: 'Record society expenses',
              icon: AlertCircle,
              gradient: 'from-error-500 to-error-600',
            },
          ].map((action, i) => (
            <button
              key={i}
              className="card card-hover group text-left animate-slide-in-up"
              style={{ animationDelay: `${0.55 + 0.05 * i}s` }}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg',
                  'bg-gradient-to-br',
                  action.gradient,
                  'group-hover:scale-110 transition-transform duration-300'
                )}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{action.title}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </PremiumLayout>
  );
}
