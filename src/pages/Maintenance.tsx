import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Plus, CreditCard, Search, Edit, Trash, Eye, IndianRupee, AlertCircle, TrendingUp, Info, Zap, Lock, Home, Calendar, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
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
import { useBillingStatus } from '../hooks/useBillingStatus';
import { useFlats, useFlatFinancialSummary } from '../hooks/useFlats';
import { useMaintenanceConfig } from '../hooks/useSocieties';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { flatsApi } from '../api/flatsApi';
import { CreateMaintenancePaymentResponse } from '../api/maintenanceApi';
import { isAdminRole, collectUserRoles } from '../types/roles';

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
  // New: formError state for business/general errors
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allocationFilter, setAllocationFilter] = useState<'all' | 'current' | 'arrears'>('all');
  const [flatFilter, setFlatFilter] = useState('all');
  const [sortField, setSortField] = useState<'paymentDate' | 'flatNumber' | 'amount'>('paymentDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const toggleSort = (field: 'paymentDate' | 'flatNumber' | 'amount') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'paymentDate' | 'flatNumber' | 'amount' }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1" />
      : <ChevronDown className="w-3 h-3 ml-1" />;
  };
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTarget, setViewTarget] = useState<any>(null);
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
  const isAdmin = isAdminRole(collectUserRoles(user));
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();

  // Fetch data
  const { data: payments = [], isLoading: paymentsLoading } = useMaintenancePayments(period);
  const { data: summary, isLoading: summaryLoading } = useMaintenanceSummary(period);
  const { data: billingStatus } = useBillingStatus();
  const { data: flats = [] } = useFlats();
  const { data: maintenanceConfig } = useMaintenanceConfig(user?.societyId || '');
  const {
    data: paymentModes = [],
    isLoading: paymentModesLoading,
    error: paymentModesError,
  } = usePaymentModes();
  const createPayment = useCreateMaintenancePayment();
  const updatePayment = useUpdateMaintenancePayment();
  const deletePayment = useDeleteMaintenancePayment();

  // Ensure arrays are always arrays
  const safeFlats = Array.isArray(flats) ? flats : [];
  const safePaymentModes = Array.isArray(paymentModes) ? paymentModes : [];

  const flatOwnerMap = useMemo(
    () => new Map(safeFlats.map(f => [f.publicId, f.ownerName])),
    [safeFlats]
  );

  const formatPeriodLabel = (periodValue: string) => {
    const [yr, mo] = periodValue.split('-').map(Number);
    if (!yr || !mo) return periodValue;
    return new Date(yr, mo - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

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

  // Pre-fill amount from maintenance config when modal opens
  useEffect(() => {
    if (showAddModal && !isEditing && maintenanceConfig?.defaultMonthlyCharge) {
      setValue('amount', String(maintenanceConfig.defaultMonthlyCharge));
    }
  }, [showAddModal, isEditing, maintenanceConfig?.defaultMonthlyCharge]);

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

  const paymentFlatIds = useMemo(
    () => [...new Set(payments.map((p) => p.flatPublicId).filter(Boolean))],
    [payments]
  );

  const paymentFlatSummaryResults = useQueries({
    queries: paymentFlatIds.map((flatPublicId) => ({
      // Must match the key invalidated by useCreateMaintenancePayment / useUpdateMaintenancePayment
      // so the status column refreshes automatically after recording a payment.
      queryKey: ['flat-financial-summary', flatPublicId],
      queryFn: () => flatsApi.getFinancialSummary(flatPublicId),
      staleTime: 0,
      enabled: !!flatPublicId,
    })),
  });

  const paymentFlatOutstandingNowMap = useMemo(() => {
    const map = new Map<string, number>();
    paymentFlatIds.forEach((flatPublicId, i) => {
      const data = paymentFlatSummaryResults[i]?.data;
      if (data) map.set(flatPublicId, data.totalOutstanding);
    });
    return map;
  }, [paymentFlatIds, paymentFlatSummaryResults]);

  const appliedBucketsByPayment = useMemo(() => {
    return new Map(
      payments.map((payment) => {
        const bucket = new Map<string, number>();
        (payment.allocations || []).forEach((allocation) => {
          if (!allocation.period) return;
          const prev = bucket.get(allocation.period) || 0;
          bucket.set(allocation.period, prev + allocation.allocatedAmount);
        });

        if (bucket.size === 0 && payment.paymentDate) {
          const derivedPeriod = payment.paymentDate.slice(0, 7);
          bucket.set(derivedPeriod, payment.amount);
        }

        const entries = [...bucket.entries()]
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([periodValue, amount]) => ({
            period: periodValue,
            label: formatPeriodLabel(periodValue),
            amount,
            kind: periodValue < period ? 'Arrear' : 'Current',
          }));

        return [payment.publicId, entries] as const;
      })
    );
  }, [payments, period]);

  const paymentBalanceById = useMemo(() => {
    const grouped = new Map<string, any[]>();
    payments.forEach((payment) => {
      const list = grouped.get(payment.flatPublicId) || [];
      list.push(payment);
      grouped.set(payment.flatPublicId, list);
    });

    const result = new Map<string, { before: number; after: number; status: 'Cleared' | 'Unpaid' | 'Partial' }>();
    grouped.forEach((flatPayments, flatPublicId) => {
      const outstandingNow = paymentFlatOutstandingNowMap.get(flatPublicId);
      if (outstandingNow == null) return;

      const chronological = [...flatPayments].sort(
        (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
      );

      // Check if all payments in this group have the backend-supplied outstandingAfterPayment.
      // If so, use it directly — it is the authoritative snapshot from the time of allocation.
      const allHaveBackendValue = chronological.every(
        (p) => p.outstandingAfterPayment != null
      );

      if (allHaveBackendValue) {
        chronological.forEach((payment) => {
          const after = payment.outstandingAfterPayment as number;
          const before = after + (payment.amount || 0);
          const status: 'Cleared' | 'Unpaid' | 'Partial' =
            after === 0 ? 'Cleared' : after < before ? 'Partial' : 'Unpaid';
          result.set(payment.publicId, { before, after, status });
        });
        return;
      }

      // Fallback: reconstruct balances from current outstanding (for older records
      // created before outstandingAfterPayment was persisted by the backend).
      const totalPaidInList = chronological.reduce((sum, p) => sum + (p.amount || 0), 0);
      let runningDue = Math.max(outstandingNow + totalPaidInList, 0);

      chronological.forEach((payment) => {
        const before = runningDue;
        const after = Math.max(before - (payment.amount || 0), 0);
        // If the flat is now fully settled, every payment contributed to clearing it.
        const status: 'Cleared' | 'Unpaid' | 'Partial' =
          outstandingNow === 0
            ? 'Cleared'
            : after === 0
            ? 'Cleared'
            : after < before
            ? 'Partial'
            : 'Unpaid';
        result.set(payment.publicId, { before, after, status });
        runningDue = after;
      });
    });

    return result;
  }, [payments, paymentFlatOutstandingNowMap]);

  const onSubmit = async (data: PaymentFormData) => {
    if (localSubmitting) return;
    setLocalSubmitting(true);
    setFormError(null); // Reset error at start
    try {
      if (!user) {
        setFormError('User not authenticated');
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
      // Prefer formError for business/general errors
      if (error?.response?.data) {
        const message = error.response.data.message || 'Failed to save payment';
        // If there are no fieldErrors, treat as general error
        if (!error.response.data.errors || error.response.data.errors.length === 0) {
          setFormError(message);
        }
        showErrorToast({
          ok: false,
          message,
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
        setFormError(error?.message || 'Failed to save payment. Please try again.');
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

  // Filter by search query (period filtering now handled by backend)
  const searchFilteredPayments = searchQuery
    ? payments.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
          (p.flatNumber || '').toLowerCase().includes(q) ||
          // (p.recordedByName || '').toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          // (p.referenceNumber || '').toLowerCase().includes(q) ||
          (p.paymentModeName || '').toLowerCase().includes(q)
        );
      })
    : payments;

  const filteredPayments = searchFilteredPayments.filter((payment) => {
    if (flatFilter !== 'all' && payment.flatPublicId !== flatFilter) return false;

    if (allocationFilter === 'all') return true;

    const applied = appliedBucketsByPayment.get(payment.publicId) || [];
    const hasCurrent = applied.some((entry) => entry.kind === 'Current');
    const hasArrear = applied.some((entry) => entry.kind === 'Arrear');

    if (allocationFilter === 'current') return hasCurrent;
    if (allocationFilter === 'arrears') return hasArrear;
    return true;
  });

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'paymentDate') {
      cmp = new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
    } else if (sortField === 'flatNumber') {
      cmp = (a.flatNumber || '').localeCompare(b.flatNumber || '', undefined, { numeric: true });
    } else if (sortField === 'amount') {
      cmp = a.amount - b.amount;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    allocationFilter !== 'all' ||
    flatFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setAllocationFilter('all');
    setFlatFilter('all');
    setCurrentPage(1);
  };

  // Reset to page 1 whenever filters or sort change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, allocationFilter, flatFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedPayments.length / PAGE_SIZE));
  const pagedPayments = sortedPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <DashboardLayout title="Maintenance Payments">
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Maintenance Payments"
          description="Track and manage maintenance fee payments"
          icon={CreditCard}
          actions={
            isAdmin && period >= getCurrentMonth() && (
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
              >
                <Plus className="w-4 h-4" />
                Record Payment
              </Button>
            )
          }
        />

        {/* ── Period Selector + Summary Cards ────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Period header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Viewing Period</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Prev month button */}
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => {
                  const opts = getMonthOptions();
                  const idx = opts.findIndex(o => o.value === period);
                  if (idx < opts.length - 1) setPeriod(opts[idx + 1].value);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                disabled={getMonthOptions().findIndex(o => o.value === period) >= getMonthOptions().length - 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Styled select */}
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors hover:border-emerald-400 dark:hover:border-emerald-500"
                >
                  {getMonthOptions().map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none rotate-90" />
              </div>

              {/* Next month button */}
              <button
                type="button"
                aria-label="Next month"
                onClick={() => {
                  const opts = getMonthOptions();
                  const idx = opts.findIndex(o => o.value === period);
                  if (idx > 0) setPeriod(opts[idx - 1].value);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                disabled={getMonthOptions().findIndex(o => o.value === period) <= 0}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Summary stat strip */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:divide-y-0 sm:divide-x sm:flex overflow-x-auto">

          {/* Total Charges */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-[130px]">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Total Charges</p>
              <p className="text-base font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                {summaryLoading ? <span className="text-slate-300">…</span> : formatCurrency(summary?.totalCharges || 0)}
              </p>
            </div>
          </div>

          {/* Collected */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-[130px]">
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
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-[140px]">
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
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-[150px]">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Opening Dues</p>
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
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-[160px]">
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
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-[130px]">
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

          </div>{/* end stat strip */}

          {/* No-bills warning inside the card */}
          {!summaryLoading && (summary?.totalCharges || 0) === 0 && (
            <div className="flex items-start gap-3 border-t border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-5 py-3">
              <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <span className="font-semibold">No bills generated for this period.</span>{' '}
                Charges, pending amounts and collection rate will show once bills are generated.{' '}
                <Link to="/dashboard" className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors">Generate Bills &rarr;</Link>
              </p>
            </div>
          )}

        </div>{/* end period+cards section */}

        {/* Payment History Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payment Records</h3>
              {!paymentsLoading && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {filteredPayments.length} {filteredPayments.length === 1 ? 'entry' : 'entries'}
                  </span>
                  {hasActiveFilters && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      of {payments.length}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search flat, mode, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9 py-1.5 text-sm w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Clear
                  </button>
                )}
              </div>

            </div>
          </div>

          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'current', label: 'Current Month' },
                  { key: 'arrears', label: 'Arrears' },
                ].map((filterItem) => (
                  <button
                    key={filterItem.key}
                    type="button"
                    onClick={() => setAllocationFilter(filterItem.key as 'all' | 'current' | 'arrears')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      allocationFilter === filterItem.key
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    {filterItem.label}
                  </button>
                ))}
              </div>

              <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">By Flat</span>
                <select
                  value={flatFilter}
                  onChange={(e) => setFlatFilter(e.target.value)}
                  className="min-w-[180px] max-w-[260px] w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="all">All Flats</option>
                  {safeFlats.map((flat) => (
                    <option key={flat.publicId} value={flat.publicId}>
                      {flat.flatNo}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {paymentsLoading ? (
            <div className="py-20">
              <LoadingSpinner centered />
            </div>
          ) : filteredPayments.length === 0 && payments.length > 0 ? (
            <div className="px-6 py-14 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No records match the current filters
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try changing search text, flat selection, or allocation type.
              </p>
              <div>
                <Button size="sm" variant="outline" onClick={clearAllFilters}>
                  Reset filters
                </Button>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={CreditCard}
                title="No payments found"
                description="Record your first payment to get started"
                action={isAdmin && period >= getCurrentMonth() ? {
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
                } : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="bg-emerald-800 dark:bg-emerald-950 border-b border-emerald-700 dark:border-emerald-900 divide-x divide-emerald-700 dark:divide-emerald-900">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => toggleSort('flatNumber')}
                        className="inline-flex items-center rounded focus:outline-none focus:ring-2 focus:ring-white/60"
                        aria-label={`Sort by flat number (${sortField === 'flatNumber' && sortDir === 'asc' ? 'ascending' : 'descending'})`}
                      >
                        Flat <SortIcon field="flatNumber" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100 uppercase tracking-wider">Paid Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100 uppercase tracking-wider">Owner</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-100 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => toggleSort('amount')}
                        className="inline-flex items-center justify-end w-full rounded focus:outline-none focus:ring-2 focus:ring-white/60"
                        aria-label={`Sort by amount (${sortField === 'amount' && sortDir === 'asc' ? 'ascending' : 'descending'})`}
                      >
                        Amount <SortIcon field="amount" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100 uppercase tracking-wider">Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100 uppercase tracking-wider">Applied To</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-100 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagedPayments.map((payment) => {
                    const isToday = !!payment.paymentDate &&
                      new Date(payment.paymentDate).toDateString() === new Date().toDateString();
                    const ownerName = flatOwnerMap.get(payment.flatPublicId);
                    const balance = paymentBalanceById.get(payment.publicId);
                    return (
                    <tr
                      key={payment.publicId}
                      onClick={() => { setViewTarget(payment); setShowViewModal(true); }}
                      className={`group cursor-pointer transition-all duration-150 divide-x divide-slate-100 dark:divide-slate-700/60 even:bg-slate-50/40 dark:even:bg-slate-900/10 ${
                        isToday
                          ? 'border-l-2 border-l-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {payment.flatNumber || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(payment.paymentDate)}</span>
                          {isToday && (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Today</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 whitespace-nowrap">
                        {ownerName ? (
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[130px] block">{ownerName}</span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-1.5 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 whitespace-nowrap">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {payment.paymentModeName || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 whitespace-nowrap">
                        {(() => {
                          const status = balance?.status || 'Unpaid';
                          const statusClass =
                            status === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : status === 'Partial'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';

                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
                              {status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2">
                        {(() => {
                          const chips = appliedBucketsByPayment.get(payment.publicId) || [];
                          if (!chips.length) return <span className="text-xs text-slate-400">—</span>;
                          const visible = chips.slice(0, 2);
                          const extra = chips.length - visible.length;
                          return (
                            <div className="flex flex-wrap gap-1">
                              {visible.map((entry) => (
                                <span
                                  key={entry.period}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                                    entry.kind === 'Arrear'
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  }`}
                                >
                                  {entry.label} · {entry.kind}
                                </span>
                              ))}
                              {extra > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  +{extra} more
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2 justify-center items-center">
                            <button
                              aria-label="View payment details"
                              onClick={(e) => { e.stopPropagation(); setViewTarget(payment); setShowViewModal(true); }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                         bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-110
                                         dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600
                                         focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                        {isAdmin && (<>
                            {(payment.allocations?.length ?? 0) > 0 || isPaymentLocked(payment) ? (
                              <Tooltip
                                content={
                                  isPaymentLocked(payment)
                                    ? 'Payments older than 30 days cannot be edited.'
                                    : 'This payment is linked to a bill. To edit, delete and recreate.'
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
                                onClick={(e) => { e.stopPropagation(); openEditModal(payment); }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                           bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110
                                           dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50
                                           focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              aria-label="Delete payment"
                              disabled={isPaymentLocked(payment)}
                              onClick={(e) => {
                                e.stopPropagation();
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
                          </>)}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedPayments.length)} of {sortedPayments.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Previous page"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce<(number | '...')[]>((acc, p, i, arr) => {
                        if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, i) =>
                        item === '...' ? (
                          <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-slate-400">…</span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setCurrentPage(item as number)}
                            className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors ${
                              currentPage === item
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    <button
                      type="button"
                      aria-label="Next page"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setLastAllocationSummary(null);
            reset();
          }}
          title={isEditing ? "Edit Payment" : "Record Payment"}
          size="xl"
        >

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          {/* ── General/Business Rule Error Banner ── */}
          {formError && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">{formError}</p>
              </div>
            </div>
          )}

          {/* ── No-bills warning banner ───────────────────────────────────── */}
          {!isEditing && !billingStatus?.isGenerated && (
            <div className="flex items-start gap-3 mx-6 mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Bills not yet generated for {billingStatus?.currentMonth
                    ? (() => { const [y, m] = billingStatus.currentMonth.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); })()
                    : 'this month'}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Payment will be recorded as advance and automatically allocated once bills are generated.{' '}
                  <Link
                    to="/dashboard"
                    className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors whitespace-nowrap"
                  >
                    Generate Bills &rarr;
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* ── Already-paid warning ──────────────────────────────────────── */}
          {!isEditing && selectedFlatPublicId && flatSummary && outstandingAmount === 0 && (
            <div className="flex items-start gap-3 mx-6 mt-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  This flat has no outstanding balance
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  The account is fully settled. Recording a payment now will be stored as an <strong>advance</strong> and automatically applied to the next bill.
                </p>
              </div>
            </div>
          )}

          {/* ── Two-column body ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 p-4 sm:p-6 pb-0">

            {/* ── LEFT: Flat selector + outstanding breakdown ─────────────── */}
            <div className="md:pr-6 md:border-r border-slate-200 dark:border-slate-700 space-y-4">

              {/* Section label */}
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Flat Details
              </p>

              {/* Flat dropdown */}
              <div className="form-field">
                <Select
                  label="Select Flat"
                  options={[
                    { value: '', label: 'Choose a flat...' },
                    ...safeFlats.map(flat => {
                      const outstanding = flatOutstandingMap.get(flat.publicId);
                      const suffix = outstanding != null && outstanding > 0
                        ? ` — ₹${outstanding.toLocaleString('en-IN')} due`
                        : outstanding === 0
                        ? ' — ✔ Clear'
                        : '';
                      return {
                        value: flat.publicId,
                        label: `${flat.flatNo} · ${flat.ownerName}${suffix}`,
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

              {/* Outstanding breakdown — always visible when flat selected */}
              {selectedFlatPublicId && flatSummary ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Row: Opening dues */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Opening Dues</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Unpaid from migration</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(openingBalanceAmount)}
                    </span>
                  </div>
                  {/* Row: Unpaid bills */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Unpaid Bills</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Current period dues</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(billOutstandingAmount)}
                    </span>
                  </div>
                  {/* Row: Total + Pay Full */}
                  <div className={`flex items-center justify-between px-4 py-3 border-t-2 ${
                    isInCredit
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                      : outstandingAmount > 0
                      ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30'
                      : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                  }`}>
                    <div>
                      <p className={`text-sm font-bold ${
                        isInCredit || outstandingAmount === 0
                          ? 'text-emerald-800 dark:text-emerald-200'
                          : 'text-orange-800 dark:text-orange-200'
                      }`}>
                        {isInCredit ? 'Advance Balance' : 'Total Outstanding'}
                      </p>
                      {outstandingAmount === 0 && !isInCredit && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">All clear ✔</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {!isInCredit && outstandingAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => setValue('amount', String(outstandingAmount))}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          Pay Full
                        </button>
                      )}
                      <span className={`text-xl font-bold ${
                        isInCredit || outstandingAmount === 0
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-orange-700 dark:text-orange-300'
                      }`}>
                        {formatCurrency(isInCredit ? advanceBalance : outstandingAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Placeholder when no flat selected */
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 h-36 gap-2">
                  <Home className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">Select a flat to see outstanding dues</p>
                </div>
              )}
            </div>

            {/* ── RIGHT: Payment fields ────────────────────────────────────── */}
            <div className="md:pl-6 space-y-4 mt-6 md:mt-0">

              {/* Section label */}
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Payment Details
              </p>

              {/* Amount — large & prominent */}
              <div className="space-y-2">
                <Input
                  label="Amount (₹)"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  error={errors.amount?.message}
                  {...register('amount')}
                />
                {/* Live remaining balance */}
                {paymentAmountNumber > 0 && selectedFlatPublicId && flatSummary && (
                  <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                    outstandingAmount === 0
                      ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                      : paymentAmountNumber >= outstandingAmount
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700'
                  }`}>
                    <span className="text-slate-500 dark:text-slate-400">
                      {outstandingAmount === 0 ? 'Will be recorded as:' : 'Balance after payment:'}
                    </span>
                    <span className={`font-bold ${
                      outstandingAmount === 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : paymentAmountNumber >= outstandingAmount
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {outstandingAmount === 0
                        ? `Advance +${formatCurrency(paymentAmountNumber)}`
                        : paymentAmountNumber >= outstandingAmount
                        ? '✔ Fully cleared'
                        : formatCurrency(outstandingAmount - paymentAmountNumber)}
                    </span>
                  </div>
                )}
              </div>

              {/* Date + Mode side by side */}
              <div className="grid grid-cols-2 gap-3 items-end">
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
                      { value: '', label: 'Select mode...' },
                      ...safePaymentModes.map(mode => ({
                        value: mode.code,
                        label: mode.displayName
                      }))
                    ]}
                    error={errors.paymentModeId?.message}
                    helperText={paymentModesLoading ? 'Loading...' : paymentModesError ? 'Unavailable' : undefined}
                    disabled={paymentModesLoading || !!paymentModesError}
                    {...register('paymentModeId')}
                  />
                </div>
              </div>

              {/* Reference */}
              {/*
              <div className="form-field">
                <Input
                  label="Reference Number"
                  placeholder="Transaction ID, cheque no., UPI ref…"
                  error={errors.referenceNumber?.message}
                  {...register('referenceNumber')}
                />
              </div>
              */}

            </div>
          </div>{/* end two-column grid */}

          {/* ── Allocation Summary (post-submit) ──────────────────────────── */}
          {lastAllocationSummary && !isEditing && (
            <div className="mx-6 mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Allocation Summary</h4>
                <Badge variant="success">Paid {formatCurrency(lastAllocationSummary.totalPaid)}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
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
                    {lastAllocationSummary.clearedPeriods.map((p) => (
                      <Badge key={p} variant="success">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Allocation Breakdown</p>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-white/70 dark:bg-slate-900/30">
                  {lastAllocationSummary.allocations.map((allocation) => {
                    const currentPeriod = new Date().toISOString().slice(0, 7);
                    const isArrear = !!allocation.period && allocation.period < currentPeriod;
                    const isCurrent = !!allocation.period && allocation.period === currentPeriod;
                    return (
                      <div key={allocation.billPublicId} className="flex items-center justify-between px-3 py-2 border-b border-emerald-100/70 dark:border-emerald-900/30 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{allocation.billPublicId}</span>
                          {isCurrent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              Current
                            </span>
                          )}
                          {isArrear && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                              Arrear
                            </span>
                          )}
                          {!allocation.period && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">Advance / OB</span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(allocation.allocatedAmount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Idempotency Key: {lastAllocationSummary.idempotencyKey}</p>
            </div>
          )}

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setIsEditing(false);
                setSelectedPayment(null);
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
      )}

      {/* ── Payment Detail View Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewTarget(null); }}
        title="Payment Receipt"
        size="md"
      >
        {viewTarget && (() => {
          const vBalance = paymentBalanceById.get(viewTarget.publicId);
          const vApplied = appliedBucketsByPayment.get(viewTarget.publicId) || [];
          const vOwner = flatOwnerMap.get(viewTarget.publicId);
          const vStatus = vBalance?.status || 'Unpaid';
          const isToday = !!viewTarget.paymentDate &&
            new Date(viewTarget.paymentDate).toDateString() === new Date().toDateString();

          const statusConfig = {
            Cleared: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Fully Paid' },
            Partial:  { bg: 'bg-amber-50  dark:bg-amber-950/30',   text: 'text-amber-700  dark:text-amber-300',  dot: 'bg-amber-400',  label: 'Partially Paid' },
            Unpaid:   { bg: 'bg-rose-50   dark:bg-rose-950/30',    text: 'text-rose-700   dark:text-rose-300',   dot: 'bg-rose-500',   label: 'Still Unpaid' },
          }[vStatus] ?? { bg: '', text: '', dot: '', label: vStatus };

          return (
            <div className="flex flex-col">

              {/* ── Top hero card ─────────────────────────────────────── */}
              <div className="px-6 pt-5 pb-5 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">

                {/* Amount + status */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Amount Paid</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(viewTarget.amount)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 mt-1 ${statusConfig.bg} ${statusConfig.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Flat + owner pill row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <Home className="w-3.5 h-3.5" />{viewTarget.flatNumber || '—'}
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{vOwner || viewTarget.ownerName || '—'}</span>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(viewTarget.paymentDate)}{isToday ? ' — Today' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {viewTarget.paymentModeName || '—'}
                  </span>
                  {viewTarget.referenceNumber && (
                    <span className="font-mono text-slate-400 dark:text-slate-500">
                      Ref: {viewTarget.referenceNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Scrollable body ───────────────────────────────────── */}
              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800" style={{ maxHeight: '52vh' }}>

                {/* How this payment settled the balance */}
                {vBalance && (
                  <div className="px-6 py-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">How it settled the balance</p>
                    <div className="grid grid-cols-3 items-center text-center gap-2">
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-3">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Balance before</p>
                        <p className="text-base font-bold text-slate-700 dark:text-slate-200">{formatCurrency(vBalance.before)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          -{formatCurrency(viewTarget.amount)}
                        </span>
                      </div>
                      <div className={`rounded-xl px-3 py-3 ${vBalance.after === 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-orange-50 dark:bg-orange-950/20'}`}>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Balance after</p>
                        <p className={`text-base font-bold ${vBalance.after === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {vBalance.after === 0 ? 'All clear ✓' : formatCurrency(vBalance.after)}
                        </p>
                      </div>
                    </div>
                    {vBalance.before > 0 && (
                      <div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((viewTarget.amount / vBalance.before) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                          This payment covered <strong>{Math.round(Math.min((viewTarget.amount / vBalance.before) * 100, 100))}%</strong> of the outstanding amount.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Which months this payment was used for */}
                {vApplied.length > 0 && (() => {
                  const arrears = vApplied.filter(e => e.kind === 'Arrear');
                  const current = vApplied.filter(e => e.kind === 'Current');
                  const arrearsTotal = arrears.reduce((s, e) => s + e.amount, 0);
                  const currentTotal = current.reduce((s, e) => s + e.amount, 0);

                  return (
                    <div className="px-6 py-4 space-y-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Which months this covered</p>

                      {current.length > 0 && (
                        <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Current Month</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(currentTotal)}</span>
                          </div>
                          <ul className="divide-y divide-emerald-50 dark:divide-emerald-900/20">
                            {current.map(e => (
                              <li key={e.period} className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900/40">
                                <span className="text-sm text-slate-700 dark:text-slate-300">{e.label}</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(e.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {arrears.length > 0 && (
                        <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/20">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Overdue Months (Arrears)</span>
                            </div>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{formatCurrency(arrearsTotal)}</span>
                          </div>
                          <ul className="divide-y divide-amber-50 dark:divide-amber-900/20">
                            {arrears.map(e => (
                              <li key={e.period} className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900/40">
                                <span className="text-sm text-slate-700 dark:text-slate-300">{e.label}</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(e.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Notes */}
                {viewTarget.notes && (
                  <div className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Notes</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg px-4 py-3 leading-relaxed">{viewTarget.notes}</p>
                  </div>
                )}

              </div>

              {/* ── Footer ─────────────────────────────────────────────── */}
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
                {isAdmin && !isPaymentLocked(viewTarget) && (
                  <Button size="sm" variant="outline"
                    onClick={() => { setShowViewModal(false); setViewTarget(null); openEditModal(viewTarget); }}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Edit Payment
                  </Button>
                )}
                <Button size="sm" variant="outline"
                  onClick={() => { setShowViewModal(false); setViewTarget(null); }}
                >
                  Close
                </Button>
              </div>

            </div>
          );
        })()}
      </Modal>

      {isAdmin && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          title="Delete Payment"
          size="sm"
        >
        <div className="space-y-4 p-4 sm:p-6">
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
      )}
    </DashboardLayout>
  );
}
