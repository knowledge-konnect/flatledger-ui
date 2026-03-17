import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { adminSubscriptionsApi } from '../api/adminSubscriptionsApi';
import { adminPlansApi } from '../api/adminPlansApi';
import {
  subscriptionUpdateSchema,
  type SubscriptionUpdateFormData,
} from '../schemas/adminSchemas';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { getAdminErrorMessage } from '../api/adminClient';

// Convert ISO string → datetime-local input value
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

// Convert datetime-local → ISO string
function fromDatetimeLocal(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

export default function AdminSubscriptionEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscriptionUpdateFormData>({
    resolver: zodResolver(subscriptionUpdateSchema),
  });

  // Load subscription
  const { data: subData, isLoading: isLoadingSub } = useQuery({
    queryKey: ['admin_subscription', id],
    queryFn: () => adminSubscriptionsApi.get(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  // Load all plans for dropdown
  const { data: plansData } = useQuery({
    queryKey: ['admin_plans_all'],
    queryFn: () => adminPlansApi.list({ page: 1, pageSize: 100 }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (subData?.data.data) {
      const s = subData.data.data;
      reset({
        planId: s.planId,
        status: s.status,
        currentPeriodStart: toDatetimeLocal(s.currentPeriodStart),
        currentPeriodEnd: toDatetimeLocal(s.currentPeriodEnd),
      });
    }
  }, [subData, reset]);

  const updateMutation = useMutation({
    mutationFn: (formData: SubscriptionUpdateFormData) => {
      const body = {
        planId: formData.planId,
        status: formData.status,
        currentPeriodStart: fromDatetimeLocal(formData.currentPeriodStart ?? ''),
        currentPeriodEnd: fromDatetimeLocal(formData.currentPeriodEnd ?? ''),
      };
      return adminSubscriptionsApi.update(id!, body);
    },
    onSuccess: () => {
      toast.success('Subscription updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin_subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin_subscription', id] });
      navigate('/admin/subscriptions');
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  if (isLoadingSub) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  const sub = subData?.data.data;
  const plans = plansData?.data.data.items ?? [];

  return (
    <div className="max-w-lg">
      <AdminPageHeader
        title="Edit Subscription"
        description={sub ? `${sub.userName} · ${sub.planName}` : ''}
        breadcrumbs={[
          { label: 'Subscriptions', href: '/admin/subscriptions' },
          { label: 'Edit' },
        ]}
      />

      {sub && (
        <div className="flex items-center gap-3 mb-5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{sub.userName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{sub.userEmail}</p>
          </div>
          <div className="ml-auto">
            <AdminStatusBadge status={sub.status} />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} noValidate>
          <div className="space-y-5">
            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Plan <span className="text-red-500">*</span>
              </label>
              <select
                {...register('planId')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="">Select a plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currency} {p.monthlyAmount} / {p.durationMonths}mo)
                  </option>
                ))}
              </select>
              {errors.planId && (
                <p className="mt-1 text-xs text-red-500">{errors.planId.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>
              )}
            </div>

            {/* Period Start / End */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Period Start
                </label>
                <input
                  {...register('currentPeriodStart')}
                  type="datetime-local"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Period End
                </label>
                <input
                  {...register('currentPeriodEnd')}
                  type="datetime-local"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {updateMutation.isPending && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Save Changes
            </button>
            <Link
              to="/admin/subscriptions"
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
