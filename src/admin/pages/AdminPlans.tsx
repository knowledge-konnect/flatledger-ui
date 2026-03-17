import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminPlansApi } from '../api/adminPlansApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { getAdminErrorMessage } from '../api/adminClient';
import type { AdminPlanDto } from '../types/adminTypes';

export default function AdminPlans() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminPlanDto | null>(null);

  const queryKey = ['admin_plans', page, search] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminPlansApi.list({ page, pageSize: 20, search }),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminPlansApi.delete(id),
    onSuccess: () => {
      toast.success('Plan deleted successfully');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
    },
    onError: (err) => {
      toast.error(getAdminErrorMessage(err));
    },
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const items = data?.data.data.items ?? [];
  const totalCount = data?.data.data.totalCount ?? 0;

  const columns: AdminColumn<AdminPlanDto>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <span className="font-medium text-slate-900 dark:text-white">{row.name}</span>
      ),
    },
    {
      key: 'monthlyAmount',
      header: 'Amount',
      cell: (row) => (
        <span>
          {row.currency}{' '}
          {row.monthlyAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
    },
    {
      key: 'durationMonths',
      header: 'Duration',
      cell: (row) => `${row.durationMonths} mo`,
    },
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
    {
      key: 'createdAt',
      header: 'Created',
      cell: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Plans"
        description="Manage subscription plans available on the platform."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Plans' }]}
        actions={
          <Link
            to="/admin/plans/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </Link>
        }
      />

      {/* Filters */}
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
          <div className="flex items-center justify-end gap-2">
            <Link
              to={`/admin/plans/${row.id}/edit`}
              className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="Delete Plan"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
