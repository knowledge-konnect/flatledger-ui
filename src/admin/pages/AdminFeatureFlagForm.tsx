import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { adminFeaturesApi } from '../api/adminFeaturesApi';
import {
  featureFlagCreateSchema,
  featureFlagUpdateSchema,
  type FeatureFlagCreateFormData,
  type FeatureFlagUpdateFormData,
} from '../schemas/adminSchemas';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { getAdminErrorMessage } from '../api/adminClient';

export default function AdminFeatureFlagForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const schema = isEdit ? featureFlagUpdateSchema : featureFlagCreateSchema;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FeatureFlagCreateFormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FeatureFlagCreateFormData>,
    defaultValues: { isEnabled: false },
  });

  const { data: flagData, isLoading } = useQuery({
    queryKey: ['admin_feature', id],
    queryFn: () => adminFeaturesApi.get(Number(id)),
    enabled: isEdit,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (flagData?.data.data) {
      const f = flagData.data.data;
      reset({
        key: f.key,
        description: f.description ?? '',
        isEnabled: f.isEnabled,
        societyId: f.societyId ?? undefined,
      });
    }
  }, [flagData, reset]);

  const createMutation = useMutation({
    mutationFn: (body: FeatureFlagCreateFormData) => adminFeaturesApi.create(body),
    onSuccess: () => {
      toast.success('Feature flag created');
      queryClient.invalidateQueries({ queryKey: ['admin_features'] });
      navigate('/admin/features');
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: FeatureFlagUpdateFormData) =>
      adminFeaturesApi.update(Number(id), body),
    onSuccess: () => {
      toast.success('Feature flag updated');
      queryClient.invalidateQueries({ queryKey: ['admin_features'] });
      queryClient.invalidateQueries({ queryKey: ['admin_feature', id] });
      navigate('/admin/features');
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  const onSubmit = (data: FeatureFlagCreateFormData) => {
    if (isEdit) {
      updateMutation.mutate({ description: data.description, isEnabled: data.isEnabled });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <AdminPageHeader
        title={isEdit ? 'Edit Feature Flag' : 'New Feature Flag'}
        breadcrumbs={[
          { label: 'Feature Flags', href: '/admin/features' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Key (create only) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Key <span className="text-red-500">*</span>
              </label>
              <input
                {...register('key')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="MY_FEATURE_KEY"
                onChange={(e) => {
                  // Auto-uppercase
                  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                  register('key').onChange(e);
                }}
              />
              <p className="mt-1 text-xs text-slate-400">
                Must be UPPER_SNAKE_CASE. Only letters, numbers and underscores.
              </p>
              {errors.key && (
                <p className="mt-1 text-xs text-red-500">{errors.key.message}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              placeholder="What does this feature flag control?"
            />
          </div>

          {/* Society ID (create only) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Society ID{' '}
                <span className="text-xs text-slate-400 font-normal">
                  (leave blank for global)
                </span>
              </label>
              <input
                {...register('societyId')}
                type="number"
                min="1"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="e.g. 42 (optional)"
              />
              {errors.societyId && (
                <p className="mt-1 text-xs text-red-500">{errors.societyId.message}</p>
              )}
            </div>
          )}

          {/* isEnabled */}
          <div className="flex items-center gap-3">
            <Controller
              name="isEnabled"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              )}
            />
            <label
              htmlFor="isEnabled"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Enabled by default
            </label>
          </div>

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
              {isEdit ? 'Save Changes' : 'Create Flag'}
            </button>
            <Link
              to="/admin/features"
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
