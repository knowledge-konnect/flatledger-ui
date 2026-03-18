import { useState, useEffect, useCallback, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { BookOpen, TrendingUp, TrendingDown, Wallet, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFoot } from '../../components/ui/Table';
import { cn } from '../../lib/utils';
import reportsApi, { FundLedgerData } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickDatePresets, startOfMonth, today, fmtDate, formatCurrency, DatePresetKey,
} from './_shared';

export default function FundLedgerPage() {
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [activeDatePreset, setActiveDatePreset] = useState<DatePresetKey | null>('thisMonth');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [state, setState] = useState<ReportState<FundLedgerData>>(initialState());

  const fetchData = useCallback((sd: string, ed: string) => {
    setState({ loading: true, error: null, data: null });
    reportsApi.getFundLedger(sd, ed)
      .then(d => setState({ loading: false, error: null, data: d }))
      .catch(e => setState({ loading: false, error: e?.response?.data?.message || e?.message || 'Failed to load', data: null }));
  }, []);

  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchData(startOfMonth(), today());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (preset: DatePresetKey, sd: string, ed: string) => {
    setActiveDatePreset(preset);
    setStartDate(sd);
    setEndDate(ed);
    setPage(0);
    fetchData(sd, ed);
  };

  const d = state.data;
  const openingBalance   = d?.opening_balance   ?? 0;
  const totalCollections = d?.total_collections ?? d?.total_credits  ?? 0;
  const totalExpenses    = d?.total_expenses    ?? d?.total_debits   ?? 0;
  const totalOpeningFund = d?.total_opening_fund ?? 0;

  const entriesAsc = [...(d?.entries ?? [])].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  const entriesDesc = [...entriesAsc].reverse();

  const balanceChartData = entriesAsc.map(e => ({
    name: e.date
      ? new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : '',
    Balance: e.running_balance,
  }));
  // footerCredit: only maintenance collection credits (entry_type === 'credit')
  // footerOpeningFund: opening fund entries (entry_type === 'opening_fund')
  // Both are credits in the ledger but kept separate so the footer matches the stat cards
  const footerCollections = d?.entries.reduce((s, e) => s + (e.entry_type === 'credit' ? (e.credit || 0) : 0), 0) ?? 0;
  const footerOpeningFund = d?.entries.reduce((s, e) => s + (e.entry_type === 'opening_fund' ? (e.credit || 0) : 0), 0) ?? 0;
  const footerCredit = footerCollections + footerOpeningFund;
  const footerDebit  = d?.entries.reduce((s, e) => s + (e.debit || 0), 0) ?? 0;

  const startIndex = page * pageSize;
  const paginatedEntries = entriesDesc.slice(startIndex, startIndex + pageSize);

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Fund Transactions"
          description="Complete transaction history with running balance"
          icon={BookOpen}
        />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest whitespace-nowrap">Date</span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setActiveDatePreset(null); }}
              className="h-8 px-2.5 text-xs font-medium rounded-md border border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <span className="text-slate-500 dark:text-slate-400 text-sm select-none">–</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setActiveDatePreset(null); }}
              className="h-8 px-2.5 text-xs font-medium rounded-md border border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 self-center" />
          <QuickDatePresets onSelect={applyPreset} activeKey={activeDatePreset} />
          <div className="flex-1" />
          <Button variant="primary" size="sm" onClick={() => { setPage(0); fetchData(startDate, endDate); }} disabled={state.loading}>
            {state.loading
              ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading…</>
              : <><RefreshCw className="w-3 h-3 mr-1" /> Apply</>}
          </Button>
        </div>

        {state.loading && <ReportLoading label="Fund Ledger" />}
        {state.error && <ReportError message={state.error} onRetry={() => fetchData(startDate, endDate)} />}
        {d && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard label="Opening Balance" value={formatCurrency(openingBalance)} icon={Wallet}
                colorClass="bg-slate-50 dark:bg-slate-800/40" iconColorClass="text-slate-500 dark:text-slate-400" />
              <StatCard label="Opening Fund" value={formatCurrency(totalOpeningFund)} icon={BookOpen}
                colorClass="bg-emerald-50 dark:bg-emerald-950/30" iconColorClass="text-emerald-600 dark:text-emerald-400" />
              <StatCard label="Total Collections" value={formatCurrency(totalCollections)} icon={TrendingUp}
                colorClass="bg-green-50 dark:bg-green-950/30" iconColorClass="text-green-600 dark:text-green-400" />
              <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown}
                colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
              <StatCard label="Closing Balance" value={formatCurrency(d.closing_balance)} icon={Wallet}
                colorClass="bg-emerald-50 dark:bg-emerald-950/30" iconColorClass="text-emerald-600 dark:text-emerald-400" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Running Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactApexChart
                  type="area"
                  height={240}
                  series={[{ name: 'Balance', data: balanceChartData.map((d: any) => d.Balance ?? 0) }]}
                  options={{
                    chart: { toolbar: { show: false }, background: 'transparent' },
                    colors: ['#10B981'],
                    stroke: { width: 2.5, curve: 'smooth' },
                    dataLabels: { enabled: false },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.02 } },
                    xaxis: { categories: balanceChartData.map((d: any) => d.name), labels: { style: { fontSize: '10px', colors: '#1e293b' }, rotate: -30 }, tickAmount: 8 },
                    yaxis: { labels: { formatter: (v: number) => `₹${(v / 1000).toFixed(0)}k`, style: { fontSize: '11px', colors: '#1e293b' } } },
                    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                    legend: { show: false },
                    grid: { borderColor: '#E2E8F0' },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left w-8">#</TableHead>
                      <TableHead className="text-left">Date</TableHead>
                      <TableHead className="text-left">Type</TableHead>
                      <TableHead className="text-right text-green-300">Credit (₹)</TableHead>
                      <TableHead className="text-right text-red-300">Debit (₹)</TableHead>
                      <TableHead className="text-right">Balance (₹)</TableHead>
                      <TableHead className="text-left">Reference</TableHead>
                      <TableHead className="text-left">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
                          {entriesDesc.length === 0 ? 'No entries found for the selected range.' : 'No results on this page'}
                        </TableCell>
                      </TableRow>
                    ) : paginatedEntries.map((e, idx) => {
                      const type = e.entry_type;
                      const isCredit      = type === 'credit';
                      const isOpeningFund = type === 'opening_fund';
                      const isDebit       = type === 'debit';
                      const actualIndex   = startIndex + idx + 1;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="text-slate-400 dark:text-slate-600 text-xs tabular-nums">{actualIndex}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs font-mono text-slate-700 dark:text-slate-300">
                            {fmtDate(e.date)}
                          </TableCell>
                          <TableCell>
                            {isCredit && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 whitespace-nowrap">Credit</span>
                            )}
                            {isDebit && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 whitespace-nowrap">Debit</span>
                            )}
                            {isOpeningFund && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 whitespace-nowrap">Opening Fund</span>
                            )}
                            {!isCredit && !isDebit && !isOpeningFund && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 whitespace-nowrap">{type}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {(e.credit || 0) > 0
                              ? <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(e.credit)}</span>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {(e.debit || 0) > 0
                              ? <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(e.debit)}</span>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            <span className={cn('font-bold text-sm', e.running_balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400')}>
                              {e.running_balance < 0 ? '(' : ''}{formatCurrency(Math.abs(e.running_balance))}{e.running_balance < 0 ? ')' : ''}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                            {e.reference || <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate italic">
                            {e.notes || <span className="text-slate-300 dark:text-slate-600 not-italic">—</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  {entriesDesc.length > 0 && (
                    <TableFoot>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                          <div>Total ({entriesDesc.length} {entriesDesc.length === 1 ? 'entry' : 'entries'})</div>
                          {footerOpeningFund > 0 && (
                            <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 normal-case">
                              incl. {formatCurrency(footerOpeningFund)} opening fund
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-green-700 dark:text-green-400 tabular-nums whitespace-nowrap">
                          {formatCurrency(footerCredit)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-red-700 dark:text-red-400 tabular-nums whitespace-nowrap">
                          {formatCurrency(footerDebit)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                          {formatCurrency(d.closing_balance)}
                        </TableCell>
                        <TableCell colSpan={2}>{''}</TableCell>
                      </TableRow>
                    </TableFoot>
                  )}
                </Table>
              </CardContent>
            </Card>

            {entriesDesc.length > pageSize && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={entriesDesc.length}
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
