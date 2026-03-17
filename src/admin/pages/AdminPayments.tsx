import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { adminPaymentsApi } from '../api/adminPaymentsApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import type { AdminPaymentDto } from '../types/adminTypes';

const PAYMENT_TYPES = [
  'maintenance',
  'expense',
  'advance',
  'penalty',
  'other',
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const [societyIdSearch, setSocietyIdSearch] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const societyId =
    societyIdSearch && !isNaN(Number(societyIdSearch))
      ? Number(societyIdSearch)
      : '';

  const queryKey = [
    'admin_payments',
    page,
    societyId,
    paymentType,
    from,
    to,
  ] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminPaymentsApi.list({ page, pageSize: 20, societyId, paymentType, from, to }),
    staleTime: 30_000,
  });

  const items = data?.data.data.items ?? [];
  const totalCount = data?.data.data.totalCount ?? 0;

  const columns: AdminColumn<AdminPaymentDto>[] = [
    {
      key: 'societyId',
      header: 'Society ID',
      cell: (row) => (
        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          #{row.societyId}
        </span>
      ),
    },
    {
      key: 'flatId',
      header: 'Flat ID',
      cell: (row) => (row.flatId ? `#${row.flatId}` : '—'),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (row) =>
        row.amount.toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        }),
    },
    {
      key: 'modeCode',
      header: 'Mode',
      cell: (row) => (
        <span className="text-xs font-semibold uppercase tracking-wide">
          {row.modeCode}
        </span>
      ),
    },
    {
      key: 'paymentType',
      header: 'Type',
      cell: (row) => (
        <span className="capitalize">{row.paymentType}</span>
      ),
    },
    {
      key: 'datePaid',
      header: 'Date Paid',
      cell: (row) => formatDate(row.datePaid),
    },
    {
      key: 'verifiedAt',
      header: 'Verified',
      cell: (row) =>
        row.verifiedAt ? (
          <AdminStatusBadge status="verified" label="Verified" />
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="All payment records. Read-only view."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Payments' }]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <AdminSearchBar
          value={societyIdSearch}
          onChange={(v) => {
            setSocietyIdSearch(v);
            setPage(1);
          }}
          placeholder="Search by Society ID…"
          className="sm:w-52"
        />
        <select
          value={paymentType}
          onChange={(e) => {
            setPaymentType(e.target.value);
            setPage(1);
          }}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All types</option>
          {PAYMENT_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {(from || to) && (
          <button
            onClick={() => { setFrom(''); setTo(''); setPage(1); }}
            className="h-9 px-3 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Clear dates
          </button>
        )}
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
        emptyMessage="No payments found."
        actions={(row) => (
          <Link
            to={`/admin/payments/${row.id}`}
            className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 transition-colors inline-flex"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        )}
      />
    </div>
  );
}
