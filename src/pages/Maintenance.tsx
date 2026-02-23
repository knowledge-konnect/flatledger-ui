import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Plus, CreditCard, Search, Edit, Trash, DollarSign, AlertCircle, TrendingUp, ChevronDown, ChevronRight, Info, Zap, Lock } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card, { CardContent } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Tooltip from '../components/ui/Tooltip';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal, { ModalFooter } from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ui/Toast';
import { useMaintenancePayments, useMaintenanceSummary, useCreateMaintenancePayment, useUpdateMaintenancePayment, useDeleteMaintenancePayment, usePaymentModes } from '../hooks/useBilling';
import { useFlats, useFlatFinancialSummary } from '../hooks/useFlats';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { flatsApi } from '../api/flatsApi';
import { CreateMaintenancePaymentResponse } from '../api/maintenanceApi';

const paymentSchema = z.object({
  flatPublicId: z.string().min(1, 'Please select a flat'),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine(val => Number(val) > 0, { message: 'Amount must be greater than ₹0' }),
  paymentModeId: z.string().min(1, 'Please select a payment mode'),
  paymentDate: z.string()
    .min(1, 'Payment date is required')
    .refine(val => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return selected <= today;
    }, { message: 'Payment date cannot be in the future' }),
  referenceNumber: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMonthOptions() {
  const options = [];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  
  return options;
}

function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeBillStatus(status?: string) {
  return (status || '').trim().toLowerCase();
}


/**
 * Accounting lock scaffold.
 * Payments older than 30 days cannot be edited or deleted.
 * Currently returns false (unlocked). Activate by uncommenting the date-check.
 */
function isPaymentLocked(_payment: any): boolean {
  return false;
  // const cutoff = new Date();
  // cutoff.setDate(cutoff.getDate() - 30);
  // return new Date(payment.paymentDate) < cutoff;
}

export default function Maintenance() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [period, setPeriod] = useState(getCurrentMonth());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showFinancialBreakdown, setShowFinancialBreakdown] = useState(false);
  const [isRefreshingLedger, setIsRefreshingLedger] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [lastAllocationSummary, setLastAllocationSummary] = useState<
    (CreateMaintenancePaymentResponse & {
      idempotencyKey: string;
      clearedPeriods: string[];
      paymentDate: string;
    }) | null
  >(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();

  // Fetch data
  const { data: payments = [], isLoading: paymentsLoading } = useMaintenancePayments();
  const { data: summary, isLoading: summaryLoading } = useMaintenanceSummary(period);
  const { data: flats = [] } = useFlats();
  const {
    data: paymentModes = [],
    isLoading: paymentModesLoading,
    error: paymentModesError,
  } = usePaymentModes();
  const createPayment = useCreateMaintenancePayment();
  const updatePayment = useUpdateMaintenancePayment();
  const deletePayment = useDeleteMaintenancePayment();

  // Ensure arrays are always arrays
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeFlats = Array.isArray(flats) ? flats : [];
  const safePaymentModes = Array.isArray(paymentModes) ? paymentModes : [];

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      flatPublicId: '',
      amount: '',
      paymentModeId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
    },
  });

  // Watch flatPublicId to fetch financial summary
  const selectedFlatPublicId = watch('flatPublicId');
  const paymentAmount = watch('amount');
  const { data: flatSummary } = useFlatFinancialSummary(
    selectedFlatPublicId || undefined
  );
  const outstandingAmount = flatSummary?.totalOutstanding ?? 0;
  const openingBalanceAmount = flatSummary?.openingBalanceRemaining ?? 0;
  const billOutstandingAmount = flatSummary?.billOutstanding ?? 0;
  // Backend guarantees totalOutstanding is non-negative; no credit state with new model
  const isInCredit = false;
  const advanceBalance = 0;
  const paymentAmountNumber = Number(paymentAmount || 0);

  // Batch-fetch outstanding for all flats so the dropdown can show live balances
  const flatSummaryResults = useQueries({
    queries: safeFlats.map(flat => ({
      queryKey: ['flat-financial-summary', flat.publicId],
      queryFn: () => flatsApi.getFinancialSummary(flat.publicId),
      staleTime: 0,
      enabled: showAddModal,
    }))
  });
  const flatOutstandingMap = useMemo(() => {
    const map = new Map<string, number>();
    safeFlats.forEach((flat, i) => {
      const d = flatSummaryResults[i]?.data;
      if (d) map.set(flat.publicId, d.totalOutstanding);
    });
    return map;
  }, [flatSummaryResults, safeFlats]);

  const onSubmit = async (data: PaymentFormData) => {
    if (localSubmitting) return; 
    setLocalSubmitting(true);
    try {
      if (!user) {
        showToast('User not authenticated', 'error');
        return;
      }

      if (isEditing && selectedPayment) {
        // Update payment
        await updatePayment.mutateAsync({
          publicId: selectedPayment.publicId,
          payload: {
            amount: Number(data.amount),
            paymentDate: new Date(data.paymentDate).toISOString(),
            paymentModeCode: data.paymentModeId,
            referenceNumber: data.referenceNumber || undefined,
          }
        });
        showToast('Payment updated successfully', 'success');
        setShowAddModal(false);
        setIsEditing(false);
        setSelectedPayment(null);
        setLastAllocationSummary(null);
        reset();
      } else {
        const idempotencyKey = generateIdempotencyKey();

        const previousLedger = await flatsApi.getLedger(data.flatPublicId).catch(() => null);
        const previouslyPaidPeriods = new Set(
          (previousLedger?.bills || [])
            .filter((bill) => normalizeBillStatus(bill.status || bill.statusCode) === 'paid')
            .map((bill) => bill.period)
        );

        const allocationResult = await createPayment.mutateAsync({
          payload: {
            flatPublicId: data.flatPublicId,
            amount: Number(data.amount),
            paymentDate: new Date(data.paymentDate).toISOString(),
            paymentModeId: data.paymentModeId,
            paymentModeCode: data.paymentModeId,
            referenceNumber: data.referenceNumber || undefined,
          },
          idempotencyKey,
        });

        setIsRefreshingLedger(true);
        const refreshedLedger = await flatsApi.getLedger(data.flatPublicId).catch(() => null);
        const clearedPeriods = (refreshedLedger?.bills || [])
          .filter((bill) => {
            const status = normalizeBillStatus(bill.status || bill.statusCode);
            return status === 'paid' && !previouslyPaidPeriods.has(bill.period);
          })
          .map((bill) => bill.period);

        setLastAllocationSummary({
          ...allocationResult,
          idempotencyKey,
          clearedPeriods,
          paymentDate: data.paymentDate,
        });

        showToast('Payment recorded and allocated successfully', 'success');
        setShowAddModal(false);
        setLastAllocationSummary(null);
        reset();
      }
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || 'Failed to save payment',
          code: error.response.data.code,
          fieldErrors: error.response.data.errors?.reduce(
            (acc: any, err: any) => {
              acc[err.field] = err.messages;
              return acc;
            },
            {}
          ),
          traceId: error.response.data.traceId,
        });
      } else {
        showToast(error?.message || 'Failed to save payment. Please try again.', 'error');
      }
    } finally {
      setIsRefreshingLedger(false);
      setLocalSubmitting(false);
    }
  };

  const openEditModal = (payment: any) => {
    setSelectedPayment(payment);
    setIsEditing(true);
    setLastAllocationSummary(null);
    // Resolve the mode code: prefer stored code, fall back to lookup by display name
    const resolvedModeCode =
      payment.paymentModeCode ||
      safePaymentModes.find(
        (m) => m.displayName.toLowerCase() === (payment.paymentModeName || '').toLowerCase()
      )?.code ||
      '';
    reset({
      flatPublicId: payment.flatPublicId,
      amount: String(payment.amount),
      paymentModeId: resolvedModeCode,
      paymentDate: payment.paymentDate.split('T')[0],
      referenceNumber: payment.referenceNumber || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (isPaymentLocked(deleteTarget)) {
      showToast('This payment is older than 30 days and cannot be deleted.', 'error');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }
    try {
      await deletePayment.mutateAsync(deleteTarget.publicId);
      showToast('Payment deleted successfully', 'success');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || 'Failed to delete payment',
          code: error.response.data.code,
          fieldErrors: error.response.data.errors?.reduce(
            (acc: any, err: any) => {
              acc[err.field] = err.messages;
              return acc;
            },
            {}
          ),
          traceId: error.response.data.traceId,
        });
      } else {
        showToast(error?.message || 'Failed to delete payment. Please try again.', 'error');
      }
    }
  };

  // Filter by period and search query
  const periodFilteredPayments = safePayments.filter(p => {
    // Fall back to parsing paymentDate in local time (API does not return a period field)
    const paymentPeriod = (p as any).period
      ? ((p as any).period as string).slice(0, 7)
      : (() => {
          const d = new Date(p.paymentDate);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return `${year}-${month}`;
        })();
    return paymentPeriod === period;
  });

  const filteredPayments = searchQuery
    ? periodFilteredPayments.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
          (p.flatNumber || '').toLowerCase().includes(q) ||
          (p.recordedByName || '').toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          (p.referenceNumber || '').toLowerCase().includes(q) ||
          (p.paymentModeName || '').toLowerCase().includes(q)
        );
      })
    : periodFilteredPayments;

  return (
    <DashboardLayout title="Maintenance Payments">    <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Maintenance Payments"
          description="Track and manage maintenance fee payments"
          icon={CreditCard}
          actions={
            <Button
              size="md"
              onClick={() => {
                setIsEditing(false);
                setSelectedPayment(null);
                setLastAllocationSummary(null);
                reset({
                  flatPublicId: '',
                  amount: '',
                  paymentModeId: '',
                  paymentDate: new Date().toISOString().split('T')[0],
                  referenceNumber: '',
                });
                setShowAddModal(true);
              }}
              disabled={!summaryLoading && (summary?.totalCharges || 0) === 0 ? false : false}
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </Button>
          }
        />

        {/* Period Selector */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Viewing Period</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {getMonthOptions().find(o => o.value === period)?.label || period}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Change month:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input w-48 appearance-none cursor-pointer pr-8"
              >
                {getMonthOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Summary Cards — compact 6-col strip */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 sm:divide-y-0 sm:divide-x sm:flex overflow-hidden shadow-sm">

          {/* Total Charges */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Total Charges</p>
              <p className="text-base font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                {summaryLoading ? <span className="text-slate-300">…</span> : formatCurrency(summary?.totalCharges || 0)}
              </p>
            </div>
          </div>

          {/* Collected */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Collected</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                {summaryLoading ? <span className="text-slate-300">…</span> : formatCurrency(summary?.totalCollected || 0)}
              </p>
            </div>
          </div>

          {/* Bill Outstanding */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Bill Outstanding</p>
              <p className={`text-base font-bold leading-tight mt-0.5 ${
                (summary?.billOutstanding || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {summaryLoading ? <span className="text-slate-300">…</span> : formatCurrency(summary?.billOutstanding || 0)}
              </p>
            </div>
          </div>

          {/* Member Opening Dues */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Member Opening Dues</p>
                <Tooltip content="Outstanding dues from members before system onboarding." side="top">
                  <Info className="w-3 h-3 text-slate-400 dark:text-slate-500 cursor-help flex-shrink-0" />
                </Tooltip>
              </div>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                {summaryLoading ? <span className="text-slate-300">…</span> : formatCurrency(summary?.openingBalanceRemaining || 0)}
              </p>
            </div>
          </div>

          {/* Total Member Outstanding */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Total Member Outstanding</p>
              <p className={`text-base font-bold leading-tight mt-0.5 ${
                (summary?.totalOutstanding || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {summaryLoading ? <span className="text-slate-300">…</span> : formatCurrency(summary?.totalOutstanding || 0)}
              </p>
            </div>
          </div>

          {/* Collection % */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Collection %</p>
              {summaryLoading ? (
                <p className="text-base font-bold text-slate-300 mt-0.5">…</p>
              ) : (summary?.totalCharges || 0) === 0 ? (
                <p className="text-base font-bold text-slate-400 dark:text-slate-500 mt-0.5">N/A</p>
              ) : (
                <>
                  <p className="text-base font-bold text-teal-600 dark:text-teal-400 leading-tight mt-0.5">
                    {(summary?.collectionPercentage || 0).toFixed(1)}%
                  </p>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-teal-500 h-1 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(summary?.collectionPercentage || 0, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* No-bills warning */}
        {!summaryLoading && (summary?.totalCharges || 0) === 0 && (
          <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    No bills generated for this period
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    <strong>Total Charges</strong>, <strong>Pending</strong>, and <strong>Collection Rate</strong> are based on monthly bills.
                    Go to <strong>Billing → Generate Bills</strong> to create bills for this period.
                    Payments recorded without bills are shown in the table below but cannot be tracked against charges.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payment Records</h3>
              {!paymentsLoading && (
                <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  {filteredPayments.length} {filteredPayments.length === 1 ? 'entry' : 'entries'}
                </span>
              )}
            </div>
            <div className="relative max-w-xs w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search flat, notes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 py-1.5 text-sm w-full"
              />
            </div>
          </div>

          {paymentsLoading ? (
            <div className="py-20">
              <LoadingSpinner centered />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={CreditCard}
                title="No payments found"
                description="Record your first payment to get started"
                action={{
                  label: 'Record Payment',
                  onClick: () => {
                    setIsEditing(false);
                    setSelectedPayment(null);
                    setLastAllocationSummary(null);
                    reset({
                      flatPublicId: '',
                      amount: '',
                      paymentModeId: '',
                      paymentDate: new Date().toISOString().split('T')[0],
                      referenceNumber: '',
                    });
                    setShowAddModal(true);
                  },
                  icon: Plus,
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 via-slate-50/70 to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Flat</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">Payment Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">Recorded By</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">Reference</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.publicId}
                      className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-950/20 dark:hover:to-purple-950/20 transition-all duration-200"
                    >
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatDate(payment.paymentDate)}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 dark:border-indigo-800/50">
                          <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {payment.flatNumber || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                        <Badge variant="default">
                          {payment.paymentModeName || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {payment.recordedByName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell">
                        <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[180px] block">
                          {payment.notes || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap hidden lg:table-cell">
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {payment.referenceNumber || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex gap-2 justify-center items-center">
                          {/* Edit button — disabled when allocated or locked */}
                          {(payment.allocations?.length ?? 0) > 0 || isPaymentLocked(payment) ? (
                            <Tooltip
                              content={
                                isPaymentLocked(payment)
                                  ? 'Payments older than 30 days cannot be edited.'
                                  : 'Allocated payments cannot be edited. Delete and recreate.'
                              }
                              side="top"
                            >
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                                               bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-50">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            </Tooltip>
                          ) : (
                            <button
                              aria-label="Edit payment"
                              onClick={() => openEditModal(payment)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                         bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-110
                                         dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900/50
                                         focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            aria-label="Delete payment"
                            disabled={isPaymentLocked(payment)}
                            onClick={() => {
                              if (isPaymentLocked(payment)) {
                                showToast('This payment is older than 30 days and cannot be deleted.', 'error');
                                return;
                              }
                              setDeleteTarget(payment);
                              setShowDeleteModal(true);
                            }}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                       focus:outline-none focus:ring-2 focus:ring-rose-500/50
                                       ${ isPaymentLocked(payment)
                                         ? 'bg-slate-100 dark:bg-slate-800 opacity-50 cursor-not-allowed'
                                         : 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-110 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50'
                                       }`}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setShowFinancialBreakdown(false);
          setLastAllocationSummary(null);
          reset();
        }}
        title={isEditing ? "Edit Payment" : "Record Payment"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="form-group space-y-5 p-6 max-h-[75vh] overflow-y-auto">
          {/* Flat Selection */}
          <div className="form-field">
            <Select
              label="Select Flat"
              options={[
                { value: '', label: 'Choose a flat...' },
                ...safeFlats.map(flat => {
                  const outstanding = flatOutstandingMap.get(flat.publicId);
                  const suffix = outstanding != null && outstanding > 0
                    ? ` (₹${outstanding.toLocaleString('en-IN')} due)`
                    : outstanding === 0
                    ? ' (✔ Clear)'
                    : '';
                  return {
                    value: flat.publicId,
                    label: `${flat.flatNo} - ${flat.ownerName}${suffix}`,
                  };
                })
              ]}
              error={errors.flatPublicId?.message}
              disabled={isEditing}
              {...register('flatPublicId')}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">Flat cannot be changed when editing a payment</p>
            )}
          </div>

          {/* Outstanding / Advance Badge */}
          {selectedFlatPublicId && flatSummary && (
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              isInCredit
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-5 h-5 ${
                  isInCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
                }`} />
                <div>
                  <p className={`text-sm font-semibold ${
                    isInCredit ? 'text-emerald-900 dark:text-emerald-100' : 'text-orange-900 dark:text-orange-100'
                  }`}>
                    {isInCredit ? 'Advance Balance (Member in Credit)' : 'Outstanding Amount'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFinancialBreakdown(!showFinancialBreakdown)}
                    className={`text-xs hover:underline flex items-center gap-1 ${
                      isInCredit ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {showFinancialBreakdown ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    View breakdown
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isInCredit && outstandingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setValue('amount', String(outstandingAmount))}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                               bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    Pay Full
                  </button>
                )}
                <span className={`text-2xl font-bold ${
                  isInCredit ? 'text-emerald-900 dark:text-emerald-100' : 'text-orange-900 dark:text-orange-100'
                }`}>
                  {formatCurrency(isInCredit ? advanceBalance : outstandingAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Financial Breakdown - Collapsible */}
          {selectedFlatPublicId && flatSummary && showFinancialBreakdown && (
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2 -mt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">
                Outstanding = Opening Dues Remaining + Unpaid Bills
              </div>
              <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Opening Dues Remaining</span>
                  <span className="text-xs text-slate-500 dark:text-slate-500">(unpaid from migration)</span>
                </div>
                <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(openingBalanceAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Unpaid Bills</span>
                <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                  + {formatCurrency(billOutstandingAmount)}
                </span>
              </div>
              {/* Total outstanding row */}
              <div className="flex items-center justify-between py-2 border-t-2 border-orange-300 dark:border-orange-700">
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Total Outstanding
                </span>
                <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(outstandingAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Amount Field with Prominent Action Button */}
          <div className="space-y-3">
            <div className="form-field">
              <Input
                label="Amount (₹)"
                type="number"
                step="0.01"
                placeholder="5000"
                error={errors.amount?.message}
                {...register('amount')}
              />
            </div>
            {paymentAmount && Number(paymentAmount) > 0 && selectedFlatPublicId && flatSummary && outstandingAmount > 0 && (
              <div className="text-sm p-2 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Remaining balance: </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(Math.max(0, outstandingAmount - paymentAmountNumber))}
                </span>
              </div>
            )}


          </div>

          {/* Payment Date & Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field">
              <Input
                label="Payment Date"
                type="date"
                error={errors.paymentDate?.message}
                {...register('paymentDate')}
              />
            </div>

            <div className="form-field">
              <Select
                label="Payment Mode"
                options={[
                  { value: '', label: 'Choose a payment mode...' },
                  ...safePaymentModes.map(mode => ({
                    value: mode.code,
                    label: mode.displayName
                  }))
                ]}
                error={errors.paymentModeId?.message}
                helperText={paymentModesLoading ? 'Loading payment modes...' : paymentModesError ? 'Unable to load payment modes' : undefined}
                disabled={paymentModesLoading || !!paymentModesError}
                {...register('paymentModeId')}
              />
            </div>
          </div>

          <div className="form-field">
            <Input
              label="Reference Number"
              placeholder="Transaction ID, cheque number, etc."
              error={errors.referenceNumber?.message}
              {...register('referenceNumber')}
            />
          </div>

          {lastAllocationSummary && !isEditing && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Allocation Summary</h4>
                <Badge variant="success">Paid {formatCurrency(lastAllocationSummary.totalPaid)}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/40 border border-emerald-100 dark:border-emerald-900/40">
                  <p className="text-slate-600 dark:text-slate-400">Allocations</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{lastAllocationSummary.allocations.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/40 border border-emerald-100 dark:border-emerald-900/40">
                  <p className="text-slate-600 dark:text-slate-400">Advance Balance</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(lastAllocationSummary.remainingAdvance || 0)}</p>
                </div>
              </div>

              {lastAllocationSummary.clearedPeriods.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Months Cleared</p>
                  <div className="flex flex-wrap gap-2">
                    {lastAllocationSummary.clearedPeriods.map((period) => (
                      <Badge key={period} variant="success">{period}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Allocation Breakdown</p>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-white/70 dark:bg-slate-900/30">
                  {lastAllocationSummary.allocations.map((allocation) => (
                    <div key={allocation.billPublicId} className="flex items-center justify-between px-3 py-2 border-b border-emerald-100/70 dark:border-emerald-900/30 last:border-b-0">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{allocation.billPublicId}</span>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(allocation.allocatedAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">Idempotency Key: {lastAllocationSummary.idempotencyKey}</p>
            </div>
          )}

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setIsEditing(false);
                setSelectedPayment(null);
                setShowFinancialBreakdown(false);
                setLastAllocationSummary(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting ||
                localSubmitting ||
                createPayment.isPending ||
                updatePayment.isPending ||
                paymentModesLoading ||
                !!paymentModesError ||
                isRefreshingLedger
              }
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isSubmitting || createPayment.isPending || updatePayment.isPending || isRefreshingLedger
                ? (isEditing ? 'Updating...' : 'Recording...')
                : (isEditing ? 'Update Payment' : 'Record Payment')
              }
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        title="Delete Payment"
        size="sm"
      >
        <div className="space-y-4 p-6">
          <p className="text-foreground">
            Are you sure you want to delete the payment for <strong>Flat {deleteTarget?.flatNumber}</strong> of <strong>{formatCurrency(deleteTarget?.amount)}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deletePayment.isPending}
            >
              <Trash className="w-4 h-4 mr-2" />
              {deletePayment.isPending ? 'Deleting...' : 'Delete Payment'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
