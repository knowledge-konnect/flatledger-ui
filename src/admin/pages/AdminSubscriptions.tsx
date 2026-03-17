import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { adminSubscriptionsApi } from '../api/adminSubscriptionsApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import type { AdminSubscriptionDto, SubscriptionStatus } from '../types/adminTypes';

const STATUS_OPTIONS: Array<{ value: SubscriptionStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminSubscriptions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');

  const queryKey = ['admin_subscriptions', page, status] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminSubscriptionsApi.list({ page, pageSize: 20, status }),
    staleTime: 30_000,
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const rawItems = data?.data.data.items ?? [];
  const totalCount = data?.data.data.totalCount ?? 0;

  // Client-side filter for user search (server doesn't have a text search param for subscriptions)
  const items = search
    ? rawItems.filter(
        (s) =>
          s.userName.toLowerCase().includes(search.toLowerCase()) ||
          s.userEmail.toLowerCase().includes(search.toLowerCase()),
      )
    : rawItems;

  const columns: AdminColumn<AdminSubscriptionDto>[] = [
    {
      key: 'userName',
      header: 'User',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">{row.userName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'planName',
      header: 'Plan',
      cell: (row) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">{row.planName}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: 'subscribedAmount',
      header: 'Amount',
      cell: (row) =>
        `${row.currency} ${row.subscribedAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
    },
    {
      key: 'currentPeriodStart',
      header: 'Period Start',
      cell: (row) => formatDate(row.currentPeriodStart),
    },
    {
      key: 'currentPeriodEnd',
      header: 'Period End',
      cell: (row) => formatDate(row.currentPeriodEnd),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Subscriptions"
        description="View and manage user subscriptions."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Subscriptions' }]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by user name or email…"
          className="sm:w-80"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SubscriptionStatus | '');
            setPage(1);
          }}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={items}
        keyField="id"
        totalCount={totalCount}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No subscriptions found."
        actions={(row) => (
          <Link
            to={`/admin/subscriptions/${row.id}/edit`}
            className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 transition-colors inline-flex"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        )}
      />
    </div>
  );
}
