import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, X, CheckCircle, XCircle } from 'lucide-react';
import { adminPaymentsApi } from '../api/adminPaymentsApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import type { AdminPaymentDto } from '../types/adminTypes';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 w-28 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-slate-900 dark:text-white">{value ?? '—'}</span>
    </div>
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

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
  const [viewTarget, setViewTarget] = useState<AdminPaymentDto | null>(null);

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
        <span className="capitalize">{row.modeCode}</span>
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
      cell: (row) => formatDate(row.datePaid ?? null),
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
          <button
            onClick={() => setViewTarget(row)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />

      {/* ── Payment Detail Dialog ── */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Payment #{viewTarget.id}</h2>
              <button onClick={() => setViewTarget(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 pb-6 pt-2">
              <DetailRow label="Payment ID" value={<span className="font-mono text-xs">#{viewTarget.id}</span>} />
              <DetailRow label="Public ID" value={<span className="font-mono text-xs">{viewTarget.publicId}</span>} />
              <DetailRow label="Society ID" value={`#${viewTarget.societyId}`} />
              <DetailRow label="Flat ID" value={viewTarget.flatId ? `#${viewTarget.flatId}` : null} />
              <DetailRow label="Bill ID" value={viewTarget.billId ? `#${viewTarget.billId}` : null} />
              <DetailRow
                label="Amount"
                value={
                  <span className="font-semibold">
                    ₹{viewTarget.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                }
              />
              <DetailRow
                label="Mode"
                value={<span className="font-semibold uppercase text-xs tracking-wider">{viewTarget.modeCode}</span>}
              />
              <DetailRow label="Type" value={<span className="capitalize">{viewTarget.paymentType}</span>} />
              <DetailRow label="Reference" value={viewTarget.reference} />
              <DetailRow label="Date Paid" value={formatDateTime(viewTarget.datePaid ?? null)} />
              <DetailRow
                label="Verified"
                value={
                  viewTarget.verifiedAt ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      {formatDateTime(viewTarget.verifiedAt)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <XCircle className="w-4 h-4" />
                      Not verified
                    </span>
                  )
                }
              />
              {viewTarget.razorpayPaymentId && (
                <DetailRow
                  label="Razorpay ID"
                  value={<span className="font-mono text-xs">{viewTarget.razorpayPaymentId}</span>}
                />
              )}
              <DetailRow label="Created At" value={formatDateTime(viewTarget.createdAt)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
