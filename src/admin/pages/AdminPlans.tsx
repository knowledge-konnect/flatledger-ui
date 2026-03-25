import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Pencil, PowerOff, X, AlertTriangle, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { adminPlansApi } from '../api/adminPlansApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { AdminDetailDrawer, DrawerSection, DrawerField } from '../components/AdminDetailDrawer';
import { getAdminErrorMessage } from '../api/adminClient';
import type { AdminPlanDto } from '../types/adminTypes';

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  monthlyAmount: z.string().refine(
    (v) => !isNaN(Number(v)) && Number(v) > 0,
    'Must be a positive number',
  ),
  currency: z.string().min(1, 'Currency is required'),
  durationMonths: z.string().refine(
    (v) => !isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) >= 1,
    'Must be a whole number ≥ 1',
  ),
});
type PlanFormData = z.infer<typeof planSchema>;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
      {children}
    </label>
  );
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function AdminPlans() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewTarget, setViewTarget] = useState<AdminPlanDto | null>(null);
  const [editTarget, setEditTarget] = useState<AdminPlanDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminPlanDto | null>(null);

  const queryKey = ['admin_plans', page, search] as const;
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminPlansApi.list({ page, pageSize: 20, search }),
    staleTime: 30_000,
  });

  const handleSearchChange = (val: string) => { setSearch(val); setPage(1); };

  const items = data?.data.data.items ?? [];
  const totalCount = data?.data.data.totalCount ?? 0;

  const createMutation = useMutation({
    mutationFn: (body: { name: string; monthlyAmount: number; currency: string; durationMonths: number }) =>
      adminPlansApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      toast.success('Plan created');
      setCreateOpen(false);
      reset();
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string; monthlyAmount: number; currency: string; durationMonths: number } }) =>
      adminPlansApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      toast.success('Plan updated');
      setEditTarget(null);
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (plan: AdminPlanDto) =>
      adminPlansApi.update(plan.id, {
        name: plan.name,
        monthlyAmount: plan.monthlyAmount,
        currency: plan.currency,
        durationMonths: plan.durationMonths,
        isActive: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      toast.success('Plan deactivated');
      setDeactivateTarget(null);
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  const openCreate = () => {
    reset({ name: '', monthlyAmount: '', currency: 'INR', durationMonths: '' });
    setCreateOpen(true);
  };

  const openEdit = (plan: AdminPlanDto) => {
    reset({
      name: plan.name,
      monthlyAmount: String(plan.monthlyAmount),
      currency: plan.currency,
      durationMonths: String(plan.durationMonths),
    });
    setEditTarget(plan);
  };

  const closeForm = () => { setCreateOpen(false); setEditTarget(null); };

  const onSubmit = (formData: PlanFormData) => {
    const body = {
      name: formData.name,
      monthlyAmount: Number(formData.monthlyAmount),
      currency: formData.currency,
      durationMonths: Number(formData.durationMonths),
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const isFormOpen = createOpen || editTarget !== null;
  const isMutating = createMutation.isPending || updateMutation.isPending;

  const columns: AdminColumn<AdminPlanDto>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.name}</span>,
    },
    {
      key: 'monthlyAmount',
      header: 'Amount',
      cell: (row) =>
        `${row.currency} ${row.monthlyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
    { key: 'currency', header: 'Currency' },
    { key: 'durationMonths', header: 'Duration', cell: (row) => `${row.durationMonths} mo` },
    {
      key: 'isActive',
      header: 'Status',
      cell: (row) => (
        <AdminStatusBadge
          status={row.isActive ? 'active' : 'disabled'}
          label={row.isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Plans"
        description="Subscription plans on the platform."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Plans' }]}
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search plans…"
          className="sm:w-72"
        />
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
        emptyMessage="No plans found."
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setViewTarget(row)}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => openEdit(row)}
              className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {row.isActive && (
              <button
                onClick={() => setDeactivateTarget(row)}
                className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-500 hover:text-amber-600 transition-colors"
                title="Deactivate"
              >
                <PowerOff className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      />

      {/* ── View Detail Drawer ── */}
      <AdminDetailDrawer
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.name ?? ''}
        subtitle={viewTarget ? `${viewTarget.currency} · ${viewTarget.durationMonths} month${viewTarget.durationMonths !== 1 ? 's' : ''}` : undefined}
        icon={CreditCard}
        iconBg="bg-indigo-600"
      >
        {viewTarget && (
          <DrawerSection title="Plan Details">
            <DrawerField label="Name" value={viewTarget.name} />
            <DrawerField
              label="Monthly Amount"
              value={
                <span className="font-semibold">
                  {`${viewTarget.currency} ${viewTarget.monthlyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </span>
              }
            />
            <DrawerField label="Currency" value={viewTarget.currency} />
            <DrawerField label="Duration" value={`${viewTarget.durationMonths} month${viewTarget.durationMonths !== 1 ? 's' : ''}`} />
            <DrawerField
              label="Status"
              value={
                <AdminStatusBadge
                  status={viewTarget.isActive ? 'active' : 'disabled'}
                  label={viewTarget.isActive ? 'Active' : 'Inactive'}
                />
              }
            />
            {viewTarget.createdAt && (
              <DrawerField
                label="Created"
                value={new Date(viewTarget.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              />
            )}
          </DrawerSection>
        )}
      </AdminDetailDrawer>

      {/* ── Create / Edit Form Dialog ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {editTarget ? 'Edit Plan' : 'New Plan'}
              </h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editTarget && (
              <div className="mx-6 mt-4 flex items-start gap-2 px-3.5 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 dark:text-amber-300">
                  Changes apply to <strong>new subscriptions only</strong>. Existing subscriptions are unaffected.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <FieldLabel>Name</FieldLabel>
                <input {...register('name')} placeholder="Plan name" className={inputCls} />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Monthly Amount</FieldLabel>
                  <input {...register('monthlyAmount')} type="number" step="0.01" placeholder="999.00" className={inputCls} />
                  {errors.monthlyAmount && <p className="mt-1 text-xs text-red-500">{errors.monthlyAmount.message}</p>}
                </div>
                <div>
                  <FieldLabel>Currency</FieldLabel>
                  <input {...register('currency')} placeholder="INR" className={inputCls} />
                  {errors.currency && <p className="mt-1 text-xs text-red-500">{errors.currency.message}</p>}
                </div>
              </div>

              <div>
                <FieldLabel>Duration (months)</FieldLabel>
                <input {...register('durationMonths')} type="number" placeholder="12" className={inputCls} />
                {errors.durationMonths && <p className="mt-1 text-xs text-red-500">{errors.durationMonths.message}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  {isMutating && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editTarget ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirm Dialog ── */}
      <AdminConfirmDialog
        open={deactivateTarget !== null}
        title="Deactivate Plan"
        isDestructive={false}
        message={
          <>
            Deactivate <strong>{deactivateTarget?.name}</strong>? New subscriptions will not be able
            to select this plan. Existing subscriptions remain unaffected.
          </>
        }
        confirmLabel="Deactivate"
        isLoading={deactivateMutation.isPending}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget)}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
