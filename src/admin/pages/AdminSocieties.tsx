import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { adminSocietiesApi } from '../api/adminSocietiesApi';
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable';
import { AdminSearchBar } from '../components/AdminSearchBar';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import type { AdminSocietyDto } from '../types/adminTypes';
import { cn } from '../../lib/utils';

export default function AdminSocieties() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

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
      cell: (row) =>
        row.onboardingDate
          ? new Date(row.onboardingDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—',
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
        // rowClassName removed as isDeleted is no longer used
        actions={(row) => (
          <Link
            to={`/admin/societies/${row.id}/edit`}
            className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 transition-colors inline-flex"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        )}
      />
    </div>
  );
}
