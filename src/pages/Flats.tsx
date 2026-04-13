import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Download, Upload, Edit, Trash, AlertCircle, Home, ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react';
import ImportFlatsModal from '../components/Flats/ImportFlatsModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';
import { exportCsv as exportCsvLib } from '../lib/exportCsv';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useFlatStatuses, useFlatFinancialSummary } from '../hooks/useFlats';
import { useMaintenanceConfig } from '../hooks/useSocieties';
import Modal, { ModalFooter } from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { formatCurrency } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { logger } from '../lib/logger';

const flatSchema = z.object({
  flatNumber: z.string().min(1, 'Flat number is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerEmail: z.string().optional(),
  ownerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  maintenanceAmount: z.string().refine(
    val => !isNaN(Number(val)) && Number(val) > 0,
    'Maintenance amount must be a positive number'
  ),
  statusCode: z.string().min(1, 'Status is required'),
});

type FlatFormData = z.infer<typeof flatSchema>;

import { useFlats, useCreateFlat, useUpdateFlat, useDeleteFlat } from '../hooks/useFlats';
import { useAuth } from '../contexts/AuthProvider';
import { isAdminRole, collectUserRoles } from '../types/roles';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { billingApi } from '../api/billingApi';

// Component to fetch and display total due details for a single flat
function FlatOutstandingBalance({ publicId, maintenanceAmount }: { publicId: string; maintenanceAmount: number }) {
  const { data: summary, isLoading } = useFlatFinancialSummary(publicId);

  if (isLoading) {
    return (
      <span className="text-slate-400 dark:text-slate-500 text-xs animate-pulse">
        Loading...
      </span>
    );
  }

  const outstanding = summary?.totalOutstanding || 0;
  const previousDue = summary?.openingBalanceRemaining || 0;
  const currentBill = summary?.billOutstanding || 0;
  const epsilon = 0.01;
  const status = outstanding <= epsilon
    ? 'paid'
    : Math.abs(outstanding - maintenanceAmount) <= epsilon
      ? 'current'
      : 'overdue';

  const amountClass = status === 'paid'
    ? 'text-emerald-700 dark:text-emerald-400'
    : status === 'current'
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-rose-700 dark:text-rose-400';

  const monthsDueRaw = maintenanceAmount > 0 ? outstanding / maintenanceAmount : 0;
  const monthsDue = Number.isInteger(monthsDueRaw)
    ? String(monthsDueRaw)
    : monthsDueRaw.toFixed(1);
  const monthsDueText = maintenanceAmount > 0
    ? `${monthsDue} ${Number(monthsDue) === 1 ? 'month' : 'months'} due`
    : 'No monthly charge';

  return (
    <div
      className="flex flex-col items-end gap-0.5 leading-tight"
      title={`Previous Due: ${formatCurrency(previousDue)} | Current Bill: ${formatCurrency(currentBill)}`}
    >
      <span className={`text-sm font-bold ${amountClass}`}>
        {formatCurrency(outstanding)}
      </span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">
        ({formatCurrency(previousDue)} prev + {formatCurrency(currentBill)} current) • {monthsDueText}
      </span>
    </div>
  );
}

// We'll map API FlatDto to the UI model used below
type UIFLat = {
  publicId: string;
  flatNumber: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  maintenanceAmount: number;
  outstandingBalance: number;
  // UI display name for status
  status: string;
  // status code (occupied, vacant, rented)
  statusCode?: string;
  // numeric status id saved in DB
  statusId?: number;
  createdAt?: string;
};

export default function Flats() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'flatNumber' | 'ownerName' | 'maintenanceAmount'>('flatNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (field: 'flatNumber' | 'ownerName' | 'maintenanceAmount') => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'flatNumber' | 'ownerName' | 'maintenanceAmount' }) => {
    if (sortBy !== field) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1" />
      : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [flats, setFlats] = useState<UIFLat[]>([]);
  const [formError, setFormError] = useState<string | null>(null); // For business rule errors
  const { user } = useAuth();
  const isAdmin = isAdminRole(collectUserRoles(user));

  const { data: apiFlats, isLoading: apiFlatsLoading } = useFlats();
  
  const createFlat = useCreateFlat();
  const updateFlat = useUpdateFlat();
  const deleteFlat = useDeleteFlat();

  const { data: statuses } = useFlatStatuses();
  const { data: maintenanceConfig } = useMaintenanceConfig(user?.societyPublicId || '');
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UIFLat | null>(null);

  // Ensure arrays are always arrays (memoized to prevent infinite loop)
  const safeStatuses = useMemo(() => Array.isArray(statuses) ? statuses : [], [statuses]);
  const safeApiFlats = useMemo(() => Array.isArray(apiFlats) ? apiFlats : [], [apiFlats]);

  const statusOptions = useMemo(() => {
    const deduped = safeStatuses.filter(
      (item, index, arr) => arr.findIndex((x) => x.code === item.code) === index
    );
    return deduped.map((s) => ({ value: s.code, label: s.displayName }));
  }, [safeStatuses]);

  const resolveStatusCode = (flat: UIFLat) => {
    if (flat.statusCode) return flat.statusCode;

    const byId = safeStatuses.find((s) => s.id === flat.statusId);
    if (byId?.code) return byId.code;

    const normalizedStatus = (flat.status || '').trim().toLowerCase();
    const byDisplayName = safeStatuses.find(
      (s) => s.displayName.trim().toLowerCase() === normalizedStatus
    );
    if (byDisplayName?.code) return byDisplayName.code;

    const byCode = safeStatuses.find(
      (s) => s.code.trim().toLowerCase() === normalizedStatus
    );
    return byCode?.code || '';
  };

  // explicit empty form baseline
  const emptyForm: FlatFormData = {
    flatNumber: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    maintenanceAmount: '',
    statusCode: '',
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FlatFormData>({
    resolver: zodResolver(flatSchema),
    defaultValues: emptyForm,
  });

  // helper to open add modal with a clean form
  const openAddModal = () => {
    setIsEditing(false);
    setSelectedFlat(null);
    reset({
      ...emptyForm,
      maintenanceAmount: maintenanceConfig?.defaultMonthlyCharge
        ? String(maintenanceConfig.defaultMonthlyCharge)
        : '',
    });
    setShowAddModal(true);
  };

  useKeyboardShortcut('n', () => {
    if (!isAdmin) return;
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    openAddModal();
  });

  const onSubmit = async (data: FlatFormData) => {
    setFormError(null); // Clear previous error
    try {
      if (!user) throw new Error('User not authenticated');

      let selectedStatusCode: string | undefined;
      if (data.statusCode) {
        selectedStatusCode = data.statusCode;
      } else if (statuses && statuses.length) {
        const def = statuses.find(s => s.code === 'occupied');
        selectedStatusCode = def?.code;
      }

      if (isEditing && selectedFlat?.publicId) {
        const payload = {
          publicId: selectedFlat.publicId,
          flatNo: data.flatNumber,
          ownerName: data.ownerName,
          contactMobile: data.ownerPhone,
          contactEmail: data.ownerEmail || undefined,
          maintenanceAmount: Number(data.maintenanceAmount),
          statusCode: selectedStatusCode,
        };
        await updateFlat.mutateAsync(payload as any);
        setShowAddModal(false);
        setIsEditing(false);
        setSelectedFlat(null);
        reset(emptyForm);
        showToast('Flat updated successfully', 'success');
      } else {
        const payload = {
          flatNo: data.flatNumber,
          ownerName: data.ownerName,
          contactMobile: data.ownerPhone,
          contactEmail: data.ownerEmail || undefined,
          maintenanceAmount: Number(data.maintenanceAmount),
          statusCode: selectedStatusCode,
        };
        const created = await createFlat.mutateAsync(payload as any);

        setShowAddModal(false);
        reset(emptyForm);

        const flatLabel = created?.flatNo ? `Flat ${created.flatNo}` : 'Flat';

        logger.log('[Flats] createFlat response:', created);

        // Trigger billing generation for the new flat
        if (created?.publicId) {
          logger.log('[Flats] Triggering billing generation for flatPublicId:', created.publicId);
          try {
            await billingApi.generateForFlat({ flatPublicId: created.publicId });
            logger.log('[Flats] Billing generation succeeded');
          } catch (billingErr) {
            logger.log('[Flats] Billing generation failed:', billingErr);
            // Billing generation failure is non-critical; flat was created successfully
          }
        } else {
          logger.log('[Flats] Skipping billing generation — no publicId on created object:', created);
        }
        showToast(`${flatLabel} created successfully`, 'success');
      }
    } catch (error: any) {
      if (error?.response?.data) {
        // If error is not a field error, show at top of form only (no toast)
        const message = error.response.data.message || 'Failed to add flat. Please try again.';
        setFormError(message);
        // Do NOT show toast for form errors to avoid duplicate messages
      } else {
        // Only show toast for unexpected errors (not form validation/business errors)
        setFormError(error?.message || 'Failed to add flat. Please try again.');
        showToast(error?.message || 'Failed to add flat. Please try again.', 'error');
      }
    }
  };

  // Map API flats to UI model whenever apiFlats or statuses change
  useEffect(() => {
    if (!safeApiFlats || !Array.isArray(safeApiFlats)) return;
    logger.log(`[Flats] Mapping ${safeApiFlats.length} API flats to UI model with ${safeStatuses.length} available statuses`);
    const mapped = safeApiFlats.map((f) => {
      const matchingStatus = safeStatuses.find(
        (s) => s.id === f.statusId || s.displayName === f.statusName
      );
      const statusCode = matchingStatus?.code;
      const statusDisplay = f.statusName || matchingStatus?.displayName || '';

      return {
        publicId: f.publicId,
        flatNumber: f.flatNo,
        ownerName: f.ownerName,
        ownerEmail: f.contactEmail ?? '',
        ownerPhone: f.contactMobile,
        maintenanceAmount: f.maintenanceAmount,
        outstandingBalance: 0, // Will be fetched separately per flat
        status: statusDisplay,
        statusCode: statusCode, // Store the code for editing
        statusId: f.statusId,
        createdAt: (f as any).createdAt,
      } as UIFLat;
    });
    logger.log(`[Flats] Successfully mapped ${mapped.length} UI flats`);
    setFlats(mapped);
  }, [safeApiFlats, safeStatuses]);

  // Filter, sort and paginate
  const processed = flats.filter(flat => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      flat.flatNumber.toLowerCase().includes(q) ||
      flat.ownerName.toLowerCase().includes(q) ||
      (flat.ownerEmail || '').toLowerCase().includes(q) ||
      (flat.ownerPhone || '').toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'flatNumber') {
      cmp = a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true });
    } else if (sortBy === 'ownerName') {
      cmp = a.ownerName.localeCompare(b.ownerName);
    } else if (sortBy === 'maintenanceAmount') {
      cmp = a.maintenanceAmount - b.maintenanceAmount;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const total = processed.length;
  const start = page * pageSize;
  const paged = processed.slice(start, start + pageSize);

  const exportCsv = () => {
    // Export all currently processed (filtered/sorted/paged) rows
    const rows = processed;
    if (!rows || rows.length === 0) {
      showToast('No flats to export', 'info');
      return;
    }
    const headers = ['Flat Number','Owner Name','Contact Mobile','Contact Email','Maintenance Amount','Status','Public ID','Created At'];
    const rowsData = rows.map(r => ({
      'Flat Number': r.flatNumber,
      'Owner Name': r.ownerName,
      'Contact Mobile': r.ownerPhone,
      'Contact Email': r.ownerEmail,
      'Maintenance Amount': r.maintenanceAmount,
      'Status': r.status,
      'Public ID': r.publicId ?? '',
      'Created At': r.createdAt ?? '',
    }));

    exportCsvLib(rowsData, headers, `flats_${user?.societyPublicId ?? 'all'}_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('CSV exported', 'success');
  };

  return (
    <DashboardLayout title="Flats Management">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
        <div className="space-y-4 sm:space-y-6 relative">{/* Modern Premium Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-500/30">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Flats
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {debouncedSearch.trim()
                    ? `${processed.length} of ${flats.length} ${flats.length === 1 ? 'unit' : 'units'} match`
                    : `${flats.length} ${flats.length === 1 ? 'unit' : 'units'} • Manage your property portfolio`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Premium Search Bar */}
            <div className="relative sm:w-80">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search flats, owners, contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-sm 
                         bg-white dark:bg-slate-900 
                         border border-slate-200 dark:border-slate-700 
                         rounded-xl shadow-sm
                         text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                         transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportCsv()} 
                disabled={flats.length === 0}
                className="h-10 px-4 font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  className="h-10 px-4 font-medium transition-all duration-200"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              )}
              {isAdmin && (
                <Button 
                  size="sm" 
                  onClick={() => openAddModal()}
                  className="h-10 px-4 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Flat
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Premium Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {apiFlatsLoading ? (
            <div className="py-20">
              <LoadingSpinner centered />
            </div>
          ) : (!flats || flats.length === 0) ? (
            <div className="py-16">
              <EmptyState
                icon={Home}
                title="No flats found"
                description={isAdmin ? "Add your first flat or import in bulk to get started" : "No flats available"}
              >
                {isAdmin && (
                  <div className="flex items-center gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowImportModal(true)}
                      className="h-10 px-4 font-medium"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Flats
                    </Button>
                    <Button
                      onClick={() => openAddModal()}
                      className="h-10 px-4 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Flat
                    </Button>
                  </div>
                )}
              </EmptyState>
            </div>
          ) : processed.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={Search}
                title="No results found"
                description={`No flats match "${debouncedSearch}"`}
              >
                <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4 h-10 px-4 font-medium">
                  <X className="w-4 h-4 mr-2" />
                  Clear search
                </Button>
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-emerald-800 dark:bg-emerald-950 border-b border-emerald-700 dark:border-emerald-900 divide-x divide-emerald-700 dark:divide-emerald-900">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider cursor-pointer select-none hover:bg-emerald-700/50 dark:hover:bg-emerald-900/50 transition-colors" onClick={() => toggleSort('flatNumber')}>
                        <span className="inline-flex items-center">Flat <SortIcon field="flatNumber" /></span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider cursor-pointer select-none hover:bg-emerald-700/50 dark:hover:bg-emerald-900/50 transition-colors" onClick={() => toggleSort('ownerName')}>
                        <span className="inline-flex items-center">Owner <SortIcon field="ownerName" /></span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider hidden md:table-cell">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider cursor-pointer select-none hover:bg-emerald-700/50 dark:hover:bg-emerald-900/50 transition-colors" onClick={() => toggleSort('maintenanceAmount')}>
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center justify-end w-full">Monthly Charge <SortIcon field="maintenanceAmount" /></span>
                          <span className="text-[10px] font-medium normal-case tracking-normal text-emerald-100/90">
                            Fixed amount per month
                          </span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider">
                        <div className="flex flex-col items-end">
                          <span>Total Due</span>
                          <span className="text-[10px] font-medium normal-case tracking-normal text-emerald-100/90">
                            Includes previous pending + current bill
                          </span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paged.map((flat) => (
                      <tr 
                        key={flat.publicId} 
                        className="group hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200 divide-x divide-slate-100 dark:divide-slate-800"
                      >
                        <td className="px-6 py-3 whitespace-nowrap align-middle">
                          <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-800/50">
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              {flat.flatNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 align-middle">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {flat.ownerName}
                            </span>
                            {flat.ownerEmail && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                                {flat.ownerEmail}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap align-middle hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                              {flat.ownerPhone}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right align-middle">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(flat.maintenanceAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right align-middle">
                          <FlatOutstandingBalance publicId={flat.publicId} maintenanceAmount={flat.maintenanceAmount} />
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap align-middle hidden sm:table-cell">
                          <StatusBadge code={flat.status} id={flat.statusId} label={flat.status} kind="flat" />
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap align-middle">
                          {isAdmin ? (
                            <div className="flex gap-2 justify-center items-center">
                              <button
                                aria-label={`Edit ${flat.flatNumber}`}
                                onClick={() => {
                                  const resolvedStatusCode = resolveStatusCode(flat);
                                  setSelectedFlat(flat);
                                  reset({
                                    flatNumber: flat.flatNumber,
                                    ownerName: flat.ownerName,
                                    ownerEmail: flat.ownerEmail ?? '',
                                    ownerPhone: flat.ownerPhone,
                                    maintenanceAmount: String(flat.maintenanceAmount),
                                    statusCode: resolvedStatusCode,
                                  });
                                  setIsEditing(true);
                                  setShowAddModal(true);
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                         bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110
                                         dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50
                                         focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                aria-label={`Delete ${flat.flatNumber}`}
                                onClick={() => {
                                  setDeleteTarget(flat);
                                  setShowDeleteModal(true);
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                         bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-110
                                         dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50
                                         focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Premium Pagination Footer */}
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-6 py-3">
                <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(p) => setPage(p)} onPageSizeChange={(s) => { setPageSize(s); setPage(0); }} />
              </div>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            reset(emptyForm);
            setIsEditing(false);
            setSelectedFlat(null);
          }}
          title={isEditing ? 'Edit Flat' : 'Add New Flat'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="form-group space-y-4 md:space-y-6 p-4 sm:p-6">
            {formError && (
              <div className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">{formError}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Input
                label="Flat Number"
                type="text"
                placeholder="e.g., A-101"
                error={errors.flatNumber?.message}
                {...register('flatNumber')}
              />

              <Input
                label="Owner Name"
                type="text"
                placeholder="Full name"
                error={errors.ownerName?.message}
                {...register('ownerName')}
              />

              <Input
                label="Email (Optional)"
                type="email"
                placeholder="owner@example.com"
                error={errors.ownerEmail?.message}
                {...register('ownerEmail')}
              />

              <Input
                label="Phone Number"
                type="tel"
                maxLength={10}
                placeholder="+1234567890"
                error={errors.ownerPhone?.message}
                {...register('ownerPhone')}
              />

              <div className="md:col-span-2">
                <Input
                  label="Maintenance Amount"
                  type="number"
                  placeholder="5000"
                  step="0.01"
                  error={errors.maintenanceAmount?.message}
                  {...register('maintenanceAmount')}
                />
              </div>

              <div className="md:col-span-2">
                <Select
                  label="Status"
                  options={[
                    { value: '', label: 'Select Status' },
                    ...statusOptions,
                  ]}
                  error={errors.statusCode?.message}
                  {...register('statusCode')}
                />
              </div>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  reset(emptyForm);
                  setIsEditing(false);
                  setSelectedFlat(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (isEditing ? updateFlat.isPending : createFlat.isPending)}
              >
                {isEditing
                  ? (updateFlat.isPending ? 'Saving...' : (isSubmitting ? 'Saving...' : 'Save'))
                  : (createFlat.isPending ? 'Adding...' : (isSubmitting ? 'Adding...' : 'Add Flat'))}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {isAdmin && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          title="Delete Flat"
          size="sm"
        >
          <div className="py-4 px-4 sm:px-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">Are you sure you want to delete <strong>{deleteTarget?.flatNumber}</strong>? This action cannot be undone.</p>
          </div>
          <ModalFooter>
            <Button
              variant="outline"
              type="button"
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
              disabled={deleteFlat.isPending}
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteFlat.mutateAsync(deleteTarget.publicId ?? '');
                  showToast('Flat deleted', 'success');
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                } catch (err: any) {
                  const errorData = err?.response?.data;
                  if (errorData) {
                    showErrorToast({
                      ok: false,
                      message: errorData.message || 'Failed to delete flat',
                      code: errorData.code,
                      fieldErrors: errorData.errors?.reduce(
                        (acc: any, errItem: any) => {
                          acc[errItem.field] = errItem.messages;
                          return acc;
                        },
                        {}
                      ),
                      traceId: errorData.traceId,
                    });
                  } else {
                    showToast('Failed to delete flat', 'error');
                  }
                }
              }}
            >
              {deleteFlat.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {isAdmin && (
        <ImportFlatsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
          }}
        />
      )}
      </div>
    </DashboardLayout>
  );
}
