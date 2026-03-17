import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { adminSettingsApi } from '../api/adminSettingsApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { getAdminErrorMessage } from '../api/adminClient';
import type { PlatformSettingDto } from '../types/adminTypes';

// ─── Inline Editable Value Cell ───────────────────────────────────────────────
function InlineEditCell({
  setting,
  onSave,
  disabled,
}: {
  setting: PlatformSettingDto;
  onSave: (key: string, value: string) => void;
  disabled: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(setting.value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setEditValue(setting.value ?? '');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = () => {
    setIsEditing(false);
    if (editValue !== (setting.value ?? '')) {
      onSave(setting.key, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      setEditValue(setting.value ?? '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 min-w-[180px]">
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="flex-1 h-8 px-2 rounded border border-indigo-400 dark:border-indigo-500 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); commit(); }}
          className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      disabled={disabled}
      className="group flex items-center gap-2 text-left text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
      title="Click to edit"
    >
      <span className="font-mono text-xs">{setting.value ?? <span className="text-slate-400 italic">empty</span>}</span>
      <Pencil className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ─── New Setting Modal ────────────────────────────────────────────────────────
function NewSettingForm({
  onSave,
  onCancel,
  isPending,
}: {
  onSave: (key: string, value: string, description: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    onSave(key.trim().toUpperCase(), value, description);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5 mb-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
        Add New Setting
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Key <span className="text-red-500">*</span>
            </label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="MY_SETTING_KEY"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Value
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 500"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this setting control?"
            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending || !key.trim()}
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isPending && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PlatformSettingDto | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  const queryKey = ['admin_settings', page, search] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminSettingsApi.list({ page, pageSize: 50, search }),
    staleTime: 30_000,
  });

  const upsertMutation = useMutation({
    mutationFn: (body: { key: string; value?: string; description?: string }) =>
      adminSettingsApi.upsert(body),
    onSuccess: (_, vars) => {
      setSavingKeys((s) => { const n = new Set(s); n.delete(vars.key); return n; });
      toast.success('Setting saved');
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] });
      setShowNewForm(false);
    },
    onError: (err, vars) => {
      setSavingKeys((s) => { const n = new Set(s); n.delete(vars.key); return n; });
      toast.error(getAdminErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => adminSettingsApi.delete(key),
    onSuccess: () => {
      toast.success('Setting deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] });
    },
    onError: (err) => toast.error(getAdminErrorMessage(err)),
  });

  const handleSaveValue = useCallback(
    (key: string, value: string) => {
      setSavingKeys((s) => new Set(s).add(key));
      upsertMutation.mutate({ key, value });
    },
    [upsertMutation],
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const items = data?.data.data.items ?? [];
  const totalCount = data?.data.data.totalCount ?? 0;

  const columns: AdminColumn<PlatformSettingDto>[] = [
    {
      key: 'key',
      header: 'Key',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.key}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      cell: (row) => (
        <InlineEditCell
          setting={row}
          onSave={handleSaveValue}
          disabled={savingKeys.has(row.key)}
        />
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {row.description ?? '—'}
        </span>
      ),
      className: 'max-w-xs',
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
        title="Platform Settings"
        description="Key-value configuration for the FlatLedger platform. Click a Value cell to edit inline."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
        actions={
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Setting
          </button>
        }
      />

      {showNewForm && (
        <NewSettingForm
          onSave={(key, value, description) =>
            upsertMutation.mutate({ key, value, description })
          }
          onCancel={() => setShowNewForm(false)}
          isPending={upsertMutation.isPending}
        />
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search settings…"
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
        emptyMessage="No settings found."
        actions={(row) => (
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      />

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="Delete Setting"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong className="font-mono">{deleteTarget?.key}</strong>? This action cannot
            be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.key)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
