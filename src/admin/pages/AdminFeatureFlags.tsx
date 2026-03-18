import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminFeaturesApi } from '../api/adminFeaturesApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { getAdminErrorMessage } from '../api/adminClient';
import type { FeatureFlagDto } from '../types/adminTypes';

// Toggle switch component
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked
          ? 'bg-indigo-600'
          : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function AdminFeatureFlags() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FeatureFlagDto | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const queryKey = ['admin_features', page, search] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminFeaturesApi.list({ page, pageSize: 50, search }),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFeaturesApi.delete(id),
    onSuccess: () => {
      toast.success('Feature flag deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin_features'] });
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  // Optimistic toggle mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      adminFeaturesApi.update(id, { isEnabled }),
    onMutate: async ({ id, isEnabled }) => {
      setTogglingIds((s) => new Set(s).add(id));
      await queryClient.cancelQueries({ queryKey: ['admin_features'] });

      // Snapshot
      const prev = queryClient.getQueryData(queryKey);

      // Optimistic update
      queryClient.setQueryData(queryKey, (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              items: old.data.data.items.map((f) =>
                f.id === id ? { ...f, isEnabled } : f,
              ),
            },
          },
        };
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      // Rollback
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast.error(getAdminErrorMessage(err));
    },
    onSettled: (_, __, variables) => {
      setTogglingIds((s) => {
        const next = new Set(s);
        next.delete(variables.id);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['admin_features'] });
    },
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const items = data?.data.data.items ?? [];
  const totalCount = data?.data.data.totalCount ?? 0;

  const columns: AdminColumn<FeatureFlagDto>[] = [
    {
      key: 'key',
      header: 'Key',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
          {row.key}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">
          {row.description ?? '—'}
        </span>
      ),
      className: 'max-w-xs truncate',
    },
    {
      key: 'societyId',
      header: 'Scope',
      cell: (row) =>
        row.societyId ? (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Society #{row.societyId}
          </span>
        ) : (
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
            Global
          </span>
        ),
    },
    {
      key: 'isEnabled',
      header: 'Enabled',
      cell: (row) => (
        <ToggleSwitch
          checked={row.isEnabled}
          onChange={(val) => toggleMutation.mutate({ id: row.id, isEnabled: val })}
          disabled={togglingIds.has(row.id)}
        />
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      cell: (row) =>
        new Date(row.updatedAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Feature Flags"
        description="Control platform feature availability globally or per society."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Feature Flags' }]}
        actions={
          <Link
            to="/admin/features/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Flag
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by key or description…"
          className="sm:w-72"
        />
      </div>

      <AdminDataTable
        columns={columns}
        data={items}
        keyField="id"
        totalCount={totalCount}
        page={page}
        pageSize={50}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No feature flags found."
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              to={`/admin/features/${row.id}/edit`}
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
        title="Delete Feature Flag"
        message={
          <>
            Are you sure you want to delete flag{' '}
            <strong className="font-mono">{deleteTarget?.key}</strong>? This action cannot be undone.
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
