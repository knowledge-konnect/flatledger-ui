import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { adminSocietiesApi } from '../api/adminSocietiesApi';
import { societyUpdateSchema, type SocietyUpdateFormData } from '../schemas/adminSchemas';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { getAdminErrorMessage } from '../api/adminClient';

export default function AdminSocietyEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SocietyUpdateFormData>({
    resolver: zodResolver(societyUpdateSchema),
  });


  const { data: societyData, isLoading } = useQuery({
    queryKey: ['admin_society', id],
    queryFn: () => adminSocietiesApi.get(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (societyData?.data.data) {
      const s = societyData.data.data;
      reset({
        name: s.name,
        address: s.address ?? '',
        city: s.city ?? '',
        state: s.state ?? '',
        pincode: s.pincode ?? '',
        currency: s.currency,
        defaultMaintenanceCycle: s.defaultMaintenanceCycle as 'monthly' | 'quarterly' | 'yearly',
      });
    }
  }, [societyData, reset]);

  const updateMutation = useMutation({
    mutationFn: (body: SocietyUpdateFormData) =>
      adminSocietiesApi.update(id!, body),
    onSuccess: () => {
      toast.success('Society updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin_societies'] });
      queryClient.invalidateQueries({ queryKey: ['admin_society', id] });
      navigate('/admin/societies');
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  const society = societyData?.data.data;

  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title="Edit Society"
        description={society?.name}
        breadcrumbs={[
          { label: 'Societies', href: '/admin/societies' },
          { label: 'Edit' },
        ]}
      />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} noValidate>
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Society Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Address
              </label>
              <input
                {...register('address')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* City / State / Pincode */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  {...register('city')}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  State
                </label>
                <input
                  {...register('state')}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Pincode
                </label>
                <input
                  {...register('pincode')}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Currency + Maintenance Cycle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Currency <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('currency')}
                  maxLength={3}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="INR"
                />
                {errors.currency && (
                  <p className="mt-1 text-xs text-red-500">{errors.currency.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Maintenance Cycle <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('defaultMaintenanceCycle')}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {errors.defaultMaintenanceCycle && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.defaultMaintenanceCycle.message}
                  </p>
                )}
              </div>
            </div>


          </div>

          {/* Actions */}
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
              to="/admin/societies"
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
