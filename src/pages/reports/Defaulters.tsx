import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, Loader2, RefreshCw, TrendingDown, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import { cn } from '../../lib/utils';
import reportsApi, { DefaulterEntry } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard, NumberInput, formatCurrency,
} from './_shared';

export default function DefaultersPage() {
  const [minOutstanding, setMinOutstanding] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [state, setState] = useState<ReportState<DefaulterEntry[]>>(initialState());

  const fetchData = useCallback((min: number) => {
    setState({ loading: true, error: null, data: null });
    reportsApi.getDefaulters(min)
      .then(d => setState({ loading: false, error: null, data: d }))
      .catch(e => setState({ loading: false, error: e?.response?.data?.message || e?.message || 'Failed to load', data: null }));
  }, []);

  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchData(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rowClass(months: number) {
    if (months > 3) return 'bg-red-50 dark:bg-red-950/20';
    if (months >= 1) return 'bg-yellow-50 dark:bg-yellow-950/20';
    return '';
  }

  const allData = state.data ?? [];
  const totalOutstanding = allData.reduce((s, d) => s + d.total_outstanding, 0);
  const startIndex = page * pageSize;
  const paginatedData = allData.slice(startIndex, startIndex + pageSize);

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Outstanding Dues"
          description="Flats with pending maintenance payments, sorted by age"
          icon={AlertTriangle}
        />

        {/* Filter Block */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-amber-200 dark:border-amber-800 shadow-sm">
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Outstanding Dues</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">• Flats with pending payments</span>
              </div>
              <div className="flex gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30">
                  <span className="w-2 h-2 rounded bg-red-500" /> {'>'} 3 months
                </span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30">
                  <span className="w-2 h-2 rounded bg-yellow-500" /> 1-3 months
                </span>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="flex flex-wrap items-end gap-2">
              <NumberInput label="Min Outstanding (₹)" value={minOutstanding} onChange={setMinOutstanding} />
              <div className="flex-1" />
              <Button variant="primary" size="sm" onClick={() => { fetchData(minOutstanding); setPage(0); }} disabled={state.loading} className="h-[34px]">
                {state.loading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                  : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
              </Button>
            </div>
          </div>
        </div>

        {state.loading && <ReportLoading label="Defaulters" />}
        {state.error && <ReportError message={state.error} onRetry={() => fetchData(minOutstanding)} />}
        {state.data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Defaulters" value={allData.length} icon={Users}
                colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
              <StatCard label="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={TrendingDown}
                colorClass="bg-orange-50 dark:bg-orange-950/30" iconColorClass="text-orange-600 dark:text-orange-400" />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flat No</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Total Billed</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Pending Months</TableHead>
                      <TableHead>Since</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center py-8 text-slate-400" colSpan={8}>
                          {allData.length === 0 ? 'No defaulters found' : 'No results on this page'}
                        </TableCell>
                      </TableRow>
                    ) : paginatedData.map(d => (
                      <TableRow key={d.flat_no} className={cn(rowClass(d.pending_months))}>
                        <TableCell className="font-semibold">{d.flat_no}</TableCell>
                        <TableCell>{d.owner_name}</TableCell>
                        <TableCell>{d.contact_mobile}</TableCell>
                        <TableCell>{formatCurrency(d.total_billed)}</TableCell>
                        <TableCell className="text-green-600 dark:text-green-400">{formatCurrency(d.total_paid)}</TableCell>
                        <TableCell className="text-red-600 dark:text-red-400 font-medium">
                          {formatCurrency(d.total_outstanding)}
                        </TableCell>
                        <TableCell>{d.pending_months}</TableCell>
                        <TableCell>{d.oldest_due_period}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {allData.length > 10 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={allData.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
