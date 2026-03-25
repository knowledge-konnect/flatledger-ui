import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AdminColumn<T> {
  key: string;
  header: string;
  cell?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface AdminDataTableProps<T> {
  columns: AdminColumn<T>[];
  data: T[];
  keyField?: keyof T;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
  rowClassName?: (row: T) => string;
}

function SkeletonRows({
  cols,
  rows = 7,
}: {
  cols: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-5 py-3.5">
              <div
                className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdminDataTable<T>({
  columns,
  data,
  keyField,
  totalCount,
  page,
  pageSize,
  onPageChange,
  isLoading = false,
  emptyMessage = 'No records found.',
  actions,
  rowClassName,
}: AdminDataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const colSpan = columns.length + (actions ? 1 : 0);

  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap',
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <SkeletonRows cols={colSpan} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-5 py-16">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox className="w-10 h-10 opacity-40" />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const key = keyField
                  ? String(row[keyField])
                  : String(idx);
                return (
                  <tr
                    key={key}
                    className={cn(
                      'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
                      rowClassName?.(row),
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-5 py-3.5 text-slate-900 dark:text-slate-100 whitespace-nowrap',
                          col.className,
                        )}
                      >
                        {col.cell
                          ? col.cell(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-5 py-3.5 text-right">
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isLoading
            ? 'Loading…'
            : totalCount === 0
            ? 'No results'
            : `Showing ${from}–${to} of ${totalCount.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
