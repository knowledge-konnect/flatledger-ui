import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, User } from 'lucide-react';
import { adminUsersApi } from '../api/adminUsersApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminDetailDrawer, DrawerSection, DrawerField } from '../components/AdminDetailDrawer';
import type { AdminUserDto } from '../types/adminTypes';

function formatDate(iso: string | undefined | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewTarget, setViewTarget] = useState<AdminUserDto | null>(null);

  const queryKey = ['admin_users', page, search] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminUsersApi.list({ page, pageSize: 20, search }),
    staleTime: 30_000,
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const items = data?.data?.data?.items ?? [];
  const totalCount = data?.data?.data?.totalCount ?? 0;

  const columns: AdminColumn<AdminUserDto>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">{row.name}</p>
          {row.email && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'societyName',
      header: 'Society',
      cell: (row) => row.societyName ?? '—',
    },
    {
      key: 'isActive',
      header: 'Active',
      cell: (row) => (
        <AdminStatusBadge status={row.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'subscriptionPlan',
      header: 'Plan',
      cell: (row) =>
        row.subscriptionPlan ? (
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {row.subscriptionPlan}
            </span>
            {row.subscriptionStatus && (
              <AdminStatusBadge status={row.subscriptionStatus} />
            )}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      cell: (row) => formatDate(row.lastLogin),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      cell: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="All society users across the platform."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name, email or mobile…"
          className="sm:w-80"
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
        emptyMessage="No users found."
        actions={(row) => (
          <button
            onClick={() => setViewTarget(row)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />

      {/* ── User Detail Drawer ── */}
      <AdminDetailDrawer
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.name ?? ''}
        subtitle={viewTarget?.email ?? viewTarget?.username ?? undefined}
        icon={User}
        iconBg="bg-teal-600"
      >
        {viewTarget && (
          <>
            <DrawerSection title="Account">
              <DrawerField label="Name" value={viewTarget.name} />
              <DrawerField label="Email" value={viewTarget.email} />
              <DrawerField label="Mobile" value={viewTarget.mobile} />
              <DrawerField label="Username" value={viewTarget.username} />
              <DrawerField
                label="Status"
                value={<AdminStatusBadge status={viewTarget.isActive ? 'active' : 'inactive'} />}
              />
            </DrawerSection>

            <DrawerSection title="Society">
              <DrawerField label="Society" value={viewTarget.societyName} />
            </DrawerSection>

            {(viewTarget.subscriptionPlan || viewTarget.subscriptionStatus || viewTarget.nextBillingDate || viewTarget.trialEndsDate) && (
              <DrawerSection title="Subscription">
                {viewTarget.subscriptionPlan && (
                  <DrawerField label="Plan" value={viewTarget.subscriptionPlan} />
                )}
                {viewTarget.subscriptionStatus && (
                  <DrawerField
                    label="Status"
                    value={<AdminStatusBadge status={viewTarget.subscriptionStatus} />}
                  />
                )}
                {viewTarget.nextBillingDate && (
                  <DrawerField label="Next Billing" value={formatDate(viewTarget.nextBillingDate)} />
                )}
                {viewTarget.trialEndsDate && (
                  <DrawerField label="Trial Ends" value={formatDate(viewTarget.trialEndsDate)} />
                )}
              </DrawerSection>
            )}

            <DrawerSection title="Activity">
              <DrawerField label="Last Login" value={formatDate(viewTarget.lastLogin)} />
              <DrawerField label="Joined" value={formatDate(viewTarget.createdAt)} />
            </DrawerSection>
          </>
        )}
      </AdminDetailDrawer>
    </div>
  );
}
