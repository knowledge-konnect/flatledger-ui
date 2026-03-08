import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Download, Edit, Trash, AlertCircle, Home } from 'lucide-react';
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
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';

// Component to fetch and display outstanding balance for a single flat
function FlatOutstandingBalance({ publicId }: { publicId: string }) {
  const { data: summary, isLoading } = useFlatFinancialSummary(publicId);

  if (isLoading) {
    return (
      <span className="text-slate-400 dark:text-slate-500 text-xs animate-pulse">
        Loading...
      </span>
    );
  }

  const outstanding = summary?.totalOutstanding || 0;
  const colorClass = outstanding > 0 
    ? 'text-[#DC2626] dark:text-[#EF4444] font-bold' 
    : 'text-[#16A34A] dark:text-[#22C55E] font-bold';

  return (
    <span className={colorClass}>
      {formatCurrency(outstanding)}
    </span>
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
  const [sortBy] = useState<'createdAt' | 'flatNumber'>('createdAt');
  const [sortDir] = useState<'desc' | 'asc'>('desc');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [flats, setFlats] = useState<UIFLat[]>([]);
  const { user } = useAuth();

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
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    openAddModal();
  });

  const onSubmit = async (data: FlatFormData) => {
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
        if (created && created.flatNo) {
          showToast(`Flat ${created.flatNo} created successfully`, 'success');
        } else {
          showToast('Flat created successfully', 'success');
        }
      }
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || 'Failed to add flat. Please try again.',
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
        ownerEmail: f.contactEmail,
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
    if (sortBy === 'createdAt') {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDir === 'asc' ? ta - tb : tb - ta;
    }
    return sortDir === 'asc' ? a.flatNumber.localeCompare(b.flatNumber) : b.flatNumber.localeCompare(a.flatNumber);
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
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Flats
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {flats.length} {flats.length === 1 ? 'unit' : 'units'} • Manage your property portfolio
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
                className="w-full pl-10 pr-4 py-2.5 text-sm 
                         bg-white dark:bg-slate-900 
                         border border-slate-200 dark:border-slate-700 
                         rounded-xl shadow-sm
                         text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         transition-all duration-200"
              />
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
              <Button 
                size="sm" 
                onClick={() => openAddModal()}
                className="h-10 px-4 font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Flat
              </Button>
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
                description="Add your first flat to get started"
                action={{
                  label: 'Add Flat',
                  onClick: () => openAddModal(),
                  icon: Plus,
                }}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 via-slate-50/70 to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Flat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Maintenance
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paged.map((flat) => (
                      <tr 
                        key={flat.publicId} 
                        className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-950/20 dark:hover:to-purple-950/20 transition-all duration-200"
                      >
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 dark:border-indigo-800/50">
                            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              {flat.flatNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
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
                        <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                              {flat.ownerPhone}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(flat.maintenanceAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right hidden lg:table-cell">
                          <FlatOutstandingBalance publicId={flat.publicId} />
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex justify-center">
                            <StatusBadge code={flat.status} id={flat.statusId} label={flat.status} kind="flat" />
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex gap-2 justify-center items-center">
                            <button
                              aria-label={`Edit ${flat.flatNumber}`}
                              onClick={() => {
                                setSelectedFlat(flat);
                                reset({
                                  flatNumber: flat.flatNumber,
                                  ownerName: flat.ownerName,
                                  ownerEmail: flat.ownerEmail,
                                  ownerPhone: flat.ownerPhone,
                                  maintenanceAmount: String(flat.maintenanceAmount),
                                  statusCode: flat.statusCode || '',
                                });
                                setIsEditing(true);
                                setShowAddModal(true);
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                       bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-110
                                       dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900/50
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="form-field">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Flat Number
              </label>
              <input
                type="text"
                placeholder="e.g., A-101"
                {...register('flatNumber')}
                className="input"
              />
              {errors.flatNumber && (
                <div className="flex items-center gap-2 mt-1 text-sm text-destructive font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  {errors.flatNumber.message}
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Owner Name
              </label>
              <input
                type="text"
                placeholder="Full name"
                {...register('ownerName')}
                className="input"
              />
              {errors.ownerName && (
                <div className="flex items-center gap-2 mt-1 text-sm text-destructive font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ownerName.message}
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Email <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                type="email"
                placeholder="owner@example.com"
                {...register('ownerEmail')}
                className="input"
              />
              {errors.ownerEmail && (
                <div className="flex items-center gap-2 mt-1 text-sm text-destructive font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ownerEmail.message}
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                maxLength={10}
                minLength={10}
                placeholder="+1234567890"
                {...register('ownerPhone')}
                className="input"
              />
              {errors.ownerPhone && (
                <div className="flex items-center gap-2 mt-1 text-sm text-destructive font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ownerPhone.message}
                </div>
              )}
            </div>

            <div className="form-field md:col-span-2">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Maintenance Amount
              </label>
              <input
                type="number"
                placeholder="5000"
                step="0.01"
                {...register('maintenanceAmount')}
                className="input"
              />
              {errors.maintenanceAmount && (
                <div className="flex items-center gap-2 mt-1 text-sm text-destructive font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  {errors.maintenanceAmount.message}
                </div>
              )}
            </div>

            <div className="form-field md:col-span-2">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Status
              </label>
              <select
                {...register('statusCode')}
                className="input"
              >
                <option value="">Select Status</option>
                {safeStatuses.map((s) => (
                  <option key={s.code} value={s.code}>{s.displayName}</option>
                ))}
              </select>
              {errors.statusCode && (
                <div className="flex items-center gap-2 mt-1 text-sm text-destructive font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  {errors.statusCode.message}
                </div>
              )}
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
              disabled={isSubmitting || (isEditing ? (updateFlat as any).isLoading : (createFlat as any).isLoading)}
            >
              {isEditing
                ? ((updateFlat as any).isLoading ? 'Saving...' : (isSubmitting ? 'Saving...' : 'Save'))
                : ((createFlat as any).isLoading ? 'Adding...' : (isSubmitting ? 'Adding...' : 'Add Flat'))}
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
            disabled={(deleteFlat as any).isLoading}
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
            {(deleteFlat as any).isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
      </div>
      {/* Import CSV UI hidden. Export provided above. */}
    </DashboardLayout>
  );
}
