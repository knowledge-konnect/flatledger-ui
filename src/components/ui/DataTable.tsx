import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useMediaQuery';
import Button from './Button';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  stickyHeader?: boolean;
  className?: string;
  emptyState?: React.ReactNode;
  actions?: (item: T) => React.ReactNode;
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * Premium Data Table Component
 * Features: Sorting, row selection, sticky header, mobile responsive
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  stickyHeader = false,
  className,
  emptyState,
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const isMobile = useIsMobile();

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map(item => item.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange?.(newSelection);
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.label).join(',');
    const rows = sortedData.map(item =>
      columns.map(col => {
        const value = (item as any)[col.key];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {sortedData.length === 0 ? (
          emptyState || (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <p>No data available</p>
            </div>
          )
        ) : (
          sortedData.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
                'transition-all duration-200',
                onRowClick && 'cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600',
                'animate-slide-in-up'
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {selectable && (
                <div className="mb-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => handleSelectRow(item.id)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {col.label}:
                    </span>
                    <span className="text-sm text-slate-900 dark:text-white">
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </span>
                  </div>
                ))}
              </div>
              {actions && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {actions(item)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {selectedIds.size > 0 && (
            <span className="font-medium">
              {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full">
          <thead
            className={cn(
              'bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-12">
                  {emptyState || (
                    <div className="text-center text-slate-500 dark:text-slate-400">
                      <p>No data available</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'bg-white dark:bg-slate-900 transition-colors animate-slide-in-up',
                    onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800',
                    selectedIds.has(item.id) && 'bg-indigo-50 dark:bg-indigo-900/20'
                  )}
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-slate-900 dark:text-white',
                        col.className
                      )}
                    >
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
