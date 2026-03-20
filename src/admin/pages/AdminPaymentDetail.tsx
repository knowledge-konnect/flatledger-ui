import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { adminPaymentsApi } from '../api/adminPaymentsApi';
import { AdminPageHeader } from '../components/AdminPageHeader';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:w-44 flex-shrink-0 mb-1 sm:mb-0">
        {label}
      </span>
      <span className="text-sm text-slate-900 dark:text-white">{value ?? '—'}</span>
    </div>
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function AdminPaymentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['admin_payment', id],
    queryFn: () => adminPaymentsApi.get(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const payment = data?.data.data;

  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title="Payment Detail"
        breadcrumbs={[
          { label: 'Payments', href: '/admin/payments' },
          { label: `#${id}` },
        ]}
      />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${50 + i * 5}%` }} />
            ))}
          </div>
        </div>
      ) : payment ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <DetailRow label="Payment ID" value={<span className="font-mono text-xs">#{payment.id}</span>} />
          <DetailRow label="Public ID" value={<span className="font-mono text-xs">{payment.publicId}</span>} />
          <DetailRow label="Society ID" value={`#${payment.societyId}`} />
          <DetailRow label="Flat ID" value={payment.flatId ? `#${payment.flatId}` : null} />
          <DetailRow label="Bill ID" value={payment.billId ? `#${payment.billId}` : null} />
          <DetailRow
            label="Amount"
            value={
              <span className="font-semibold text-lg">
                ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            }
          />
          <DetailRow
            label="Mode"
            value={
              <span className="font-semibold uppercase text-xs tracking-wider">
                {payment.modeCode}
              </span>
            }
          />
          <DetailRow
            label="Payment Type"
            value={<span className="capitalize">{payment.paymentType}</span>}
          />
          <DetailRow label="Reference" value={payment.reference} />
          <DetailRow label="Date Paid" value={formatDateTime(payment.datePaid)} />
          <DetailRow
            label="Verified"
            value={
              payment.verifiedAt ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  {formatDateTime(payment.verifiedAt)}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <XCircle className="w-4 h-4" />
                  Not verified
                </span>
              )
            }
          />
          {payment.razorpayPaymentId && (
            <DetailRow
              label="Razorpay ID"
              value={<span className="font-mono text-xs">{payment.razorpayPaymentId}</span>}
            />
          )}
          <DetailRow label="Created At" value={formatDateTime(payment.createdAt)} />
          // ...existing code...
        </div>
      ) : (
        <div className="text-sm text-slate-500 p-6 text-center">Payment not found.</div>
      )}
    </div>
  );
}
