import { useQuery } from '@tanstack/react-query';
import { Building2, Eye } from 'lucide-react';
import { useState } from 'react';
import { cn, formatDate } from '../../lib/utils';
import { adminSocietiesApi } from '../api/adminSocietiesApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminDetailDrawer, DrawerField, DrawerSection } from '../components/AdminDetailDrawer';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import type { AdminSocietyDto } from '../types/adminTypes';

export default function AdminSocieties() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewTargetId, setViewTargetId] = useState<number | null>(null);

  const queryKey = ['admin_societies', page, search] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminSocietiesApi.list({
        page,
        pageSize: 20,
        search,
      }),
    staleTime: 30_000,
  });

  // Load full detail (with aggregate counts) only when drawer is open
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin_society_detail', viewTargetId],
    queryFn: () => adminSocietiesApi.get(viewTargetId!),
    enabled: viewTargetId !== null,
    staleTime: 30_000,
  });
  const viewTarget = detailData?.data?.data ?? null;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const items = data?.data?.data?.items ?? [];
  const totalCount = data?.data?.data?.totalCount ?? 0;

  const columns: AdminColumn<AdminSocietyDto>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <span className={cn('font-medium', 'text-slate-900 dark:text-white')}>
          {row.name}
        </span>
      ),
    },
    { key: 'city', header: 'City', cell: (row) => row.city ?? '—' },
    { key: 'state', header: 'State', cell: (row) => row.state ?? '—' },
    { key: 'currency', header: 'Currency' },
    {
      key: 'defaultMaintenanceCycle',
      header: 'Cycle',
      cell: (row) => (
        <span className="capitalize">{row.defaultMaintenanceCycle}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Onboarded',
      cell: (row) => (row.onboardingDate ? formatDate(row.onboardingDate) : '—'),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Societies"
        description="All registered societies on the platform."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Societies' }]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or city…"
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
        emptyMessage="No societies found."
        actions={(row) => (
          <button
            onClick={() => setViewTargetId(row.id)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />

      {/* ── Society Detail Drawer ── */}
      <AdminDetailDrawer
        open={viewTargetId !== null}
        onClose={() => setViewTargetId(null)}
        title={viewTarget?.name ?? 'Society'}
        subtitle={[viewTarget?.city, viewTarget?.state].filter(Boolean).join(', ') || undefined}
        icon={Building2}
        iconBg="bg-blue-600"
        isLoading={isDetailLoading || !viewTarget}
      >
        {viewTarget && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Total Flats', value: viewTarget.flatCount },
                { label: 'Active Flats', value: viewTarget.activeFlatCount },
                { label: 'Total Users', value: viewTarget.userCount },
                { label: 'Active Users', value: viewTarget.activeUserCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-3 text-center border border-slate-100 dark:border-slate-700"
                >
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Active subscription banner */}
            {viewTarget.activeSubscription && (
              <div className="mb-5 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                    {viewTarget.activeSubscription.planName}
                  </p>
                  {viewTarget.activeSubscription.currentPeriodEnd && (
                    <p className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-0.5">
                      Renews {formatDate(viewTarget.activeSubscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
                <AdminStatusBadge status={viewTarget.activeSubscription.status} />
              </div>
            )}

            <DrawerSection title="Info">
              <DrawerField label="Address" value={viewTarget.address} />
              <DrawerField label="City" value={viewTarget.city} />
              <DrawerField label="State" value={viewTarget.state} />
              <DrawerField label="Pincode" value={viewTarget.pincode} />
              <DrawerField label="Currency" value={viewTarget.currency} />
              <DrawerField
                label="Cycle"
                value={<span className="capitalize">{viewTarget.defaultMaintenanceCycle}</span>}
              />
              <DrawerField label="Onboarded" value={viewTarget.onboardingDate ? formatDate(viewTarget.onboardingDate) : undefined} />
              <DrawerField label="Created" value={formatDate(viewTarget.createdAt)} />
            </DrawerSection>
          </>
        )}
      </AdminDetailDrawer>
    </div>
  );
}
