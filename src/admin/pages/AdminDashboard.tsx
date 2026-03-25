import { useQueries } from '@tanstack/react-query';
import {
  CreditCard,
  Building2,
  Layers,
  BarChart3,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminPlansApi } from '../api/adminPlansApi';
import { adminSocietiesApi } from '../api/adminSocietiesApi';
import { adminSubscriptionsApi } from '../api/adminSubscriptionsApi';
import { adminPaymentsApi } from '../api/adminPaymentsApi';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  accentBorder: string;
  linkTo: string;
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
  iconColor,
  accentBorder,
  linkTo,
  isLoading,
}: StatCardProps) {
  return (
    <Link
      to={linkTo}
      className={`group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 border-t-4 ${accentBorder} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          {subLabel && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subLabel}</p>
          )}
        </>
      )}
    </Link>
  );
}

export default function AdminDashboard() {
    const quickActions = [
      { label: 'Create Plan', href: '/admin/plans/new', color: 'indigo' },
      { label: 'View Payments', href: '/admin/payments', color: 'amber' },
      { label: 'Platform Settings', href: '/admin/settings', color: 'slate' },
    ];
  const { admin } = useAdminAuth();

  const results = useQueries({
    queries: [
      {
        queryKey: ['admin_plans_count'],
        queryFn: () => adminPlansApi.list({ page: 1, pageSize: 1 }),
        staleTime: 60_000,
      },
      {
        queryKey: ['admin_societies_count'],
        queryFn: () => adminSocietiesApi.list({ page: 1, pageSize: 1 }),
        staleTime: 60_000,
      },
      {
        queryKey: ['admin_subscriptions_active_count'],
        queryFn: () =>
          adminSubscriptionsApi.list({ page: 1, pageSize: 1, status: 'active' }),
        staleTime: 60_000,
      },
      {
        queryKey: ['admin_payments_count'],
        queryFn: () => adminPaymentsApi.list({ page: 1, pageSize: 1 }),
        staleTime: 60_000,
      },
      {
        queryKey: ['admin_subscriptions_total_count'],
        queryFn: () => adminSubscriptionsApi.list({ page: 1, pageSize: 1 }),
        staleTime: 60_000,
      },
    ],
  });

  const [plans, societies, activeSubs, payments, allSubs] = results;

  const stats = [
    {
      label: 'Total Plans',
      value: plans.data?.data.data.totalCount ?? 0,
      icon: CreditCard,
      iconColor: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
      accentBorder: 'border-t-indigo-500',
      linkTo: '/admin/plans',
      isLoading: plans.isLoading,
    },
    {
      label: 'Societies',
      value: societies.data?.data.data.totalCount ?? 0,
      icon: Building2,
      iconColor: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      accentBorder: 'border-t-emerald-500',
      linkTo: '/admin/societies',
      isLoading: societies.isLoading,
    },
    {
      label: 'Total Subscriptions',
      value: allSubs.data?.data.data.totalCount ?? 0,
      subLabel: `${activeSubs.data?.data.data.totalCount ?? 0} active`,
      icon: Layers,
      iconColor: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
      accentBorder: 'border-t-violet-500',
      linkTo: '/admin/subscriptions',
      isLoading: allSubs.isLoading,
    },
    {
      label: 'Total Payments',
      value: payments.data?.data.data.totalCount ?? 0,
      icon: BarChart3,
      iconColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      accentBorder: 'border-t-amber-500',
      linkTo: '/admin/payments',
      isLoading: payments.isLoading,
    },
  ];

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <AdminPageHeader
        title={`${greeting}, ${admin?.name?.split(' ')[0] ?? 'Admin'} 👋`}
        description="Here's an overview of the FlatLedger platform."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all duration-200"
            >
              {action.label}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
