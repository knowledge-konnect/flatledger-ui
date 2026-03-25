import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Receipt } from 'lucide-react';
import { adminInvoicesApi } from '../api/adminInvoicesApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminDetailDrawer, DrawerSection, DrawerField } from '../components/AdminDetailDrawer';
import type { AdminInvoiceDto } from '../types/adminTypes';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
];

function formatDate(iso: string | undefined | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminInvoices() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [viewTarget, setViewTarget] = useState<AdminInvoiceDto | null>(null);

  const queryKey = ['admin_invoices', page, status] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminInvoicesApi.list({
        page,
        pageSize: 20,
        status: status || undefined,
      }),
    staleTime: 30_000,
  });

  const items = data?.data?.data?.items ?? [];
  const totalCount = data?.data?.data?.totalCount ?? 0;

  const columns: AdminColumn<AdminInvoiceDto>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'User',
      cell: (row) => row.userName ?? `#${row.userId}`,
    },
    {
      key: 'invoiceType',
      header: 'Type',
      cell: (row) => <span className="capitalize">{row.invoiceType}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      cell: (row) => {
        const symbol = row.currency === 'INR' ? '₹' : (row.currency ?? '');
        return `${symbol}${row.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: 'dueDate',
      header: 'Due',
      cell: (row) => formatDate(row.dueDate),
    },
    {
      key: 'paidDate',
      header: 'Paid',
      cell: (row) => formatDate(row.paidDate),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Invoices"
        description="Platform-level subscription invoices."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Invoices' }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
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
        emptyMessage="No invoices found."
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

      {/* ── Invoice Detail Drawer ── */}
      <AdminDetailDrawer
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.invoiceNumber ?? ''}
        subtitle={viewTarget?.userName ?? undefined}
        icon={Receipt}
        iconBg="bg-violet-600"
      >
        {viewTarget && (
          <>
            <DrawerSection title="Invoice">
              <DrawerField
                label="Number"
                value={<span className="font-mono text-xs tracking-wider">{viewTarget.invoiceNumber}</span>}
              />
              <DrawerField label="Type" value={<span className="capitalize">{viewTarget.invoiceType}</span>} />
              <DrawerField
                label="Status"
                value={<AdminStatusBadge status={viewTarget.status} />}
              />
            </DrawerSection>

            <DrawerSection title="Amounts">
              <DrawerField
                label="Amount"
                value={`${viewTarget.currency ?? ''} ${viewTarget.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              />
              {viewTarget.taxAmount != null && (
                <DrawerField
                  label="Tax"
                  value={`${viewTarget.currency ?? ''} ${viewTarget.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                />
              )}
              <DrawerField
                label="Total"
                value={
                  <span className="font-semibold text-base">
                    {`${viewTarget.currency ?? ''} ${viewTarget.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </span>
                }
              />
            </DrawerSection>

            <DrawerSection title="Dates">
              {(viewTarget.periodStart || viewTarget.periodEnd) && (
                <DrawerField
                  label="Period"
                  value={`${viewTarget.periodStart ?? '—'} → ${viewTarget.periodEnd ?? '—'}`}
                />
              )}
              <DrawerField label="Due Date" value={formatDate(viewTarget.dueDate)} />
              <DrawerField label="Paid Date" value={formatDate(viewTarget.paidDate)} />
            </DrawerSection>

            {(viewTarget.paymentMethod || viewTarget.paymentReference) && (
              <DrawerSection title="Payment">
                {viewTarget.paymentMethod && (
                  <DrawerField
                    label="Method"
                    value={<span className="capitalize">{viewTarget.paymentMethod}</span>}
                  />
                )}
                {viewTarget.paymentReference && (
                  <DrawerField
                    label="Reference"
                    value={<span className="font-mono text-xs">{viewTarget.paymentReference}</span>}
                  />
                )}
              </DrawerSection>
            )}
          </>
        )}
      </AdminDetailDrawer>
    </div>
  );
}
