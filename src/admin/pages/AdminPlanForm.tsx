import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { adminPlansApi } from '../api/adminPlansApi';
import { planUpdateSchema, type PlanCreateFormData, type PlanUpdateFormData } from '../schemas/adminSchemas';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { getAdminErrorMessage } from '../api/adminClient';

export default function AdminPlanForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanUpdateFormData>({
    resolver: zodResolver(planUpdateSchema) as Resolver<PlanUpdateFormData>,
    defaultValues: { currency: 'INR', durationMonths: 1 },
  });

  // Load existing plan for edit
  const { data: planData, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['admin_plan', id],
    queryFn: () => adminPlansApi.get(id!),
    enabled: isEdit,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (planData?.data.data) {
      const p = planData.data.data;
      reset({
        name: p.name,
        monthlyAmount: p.monthlyAmount,
        currency: p.currency,
        durationMonths: p.durationMonths,
        isActive: p.isActive,
      });
    }
  }, [planData, reset]);

  const createMutation = useMutation({
    mutationFn: (body: PlanCreateFormData) => adminPlansApi.create(body),
    onSuccess: () => {
      toast.success('Plan created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      navigate('/admin/plans');
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: PlanUpdateFormData) => adminPlansApi.update(id!, body),
    onSuccess: () => {
      toast.success('Plan updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin_plan', id] });
      navigate('/admin/plans');
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  const onSubmit = (data: PlanUpdateFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isActive: _ignored, ...createData } = data;
      createMutation.mutate(createData as PlanCreateFormData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingPlan) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <AdminPageHeader
        title={isEdit ? 'Edit Plan' : 'New Plan'}
        breadcrumbs={[
          { label: 'Plans', href: '/admin/plans' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="e.g. Pro"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Amount <span className="text-red-500">*</span>
              </label>
              <input
                {...register('monthlyAmount')}
                type="number"
                step="0.01"
                min="0"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="999.00"
              />
              {errors.monthlyAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.monthlyAmount.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Currency <span className="text-red-500">*</span>
              </label>
              <input
                {...register('currency')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="INR"
                maxLength={3}
              />
              {errors.currency && (
                <p className="mt-1 text-xs text-red-500">{errors.currency.message}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Duration (months) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('durationMonths')}
              type="number"
              min="1"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="1"
            />
            {errors.durationMonths && (
              <p className="mt-1 text-xs text-red-500">{errors.durationMonths.message}</p>
            )}
          </div>

          {/* isActive (edit only) */}
          {isEdit && (
            <div className="flex items-center gap-3">
              <input
                {...register('isActive')}
                type="checkbox"
                id="isActive"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Plan is active
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isPending && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isEdit ? 'Save Changes' : 'Create Plan'}
            </button>
            <Link
              to="/admin/plans"
              className="h-10 px-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
