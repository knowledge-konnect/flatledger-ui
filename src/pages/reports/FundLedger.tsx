import { useState, useEffect, useCallback, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { BookOpen, TrendingUp, TrendingDown, Wallet, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { cn } from '../../lib/utils';
import reportsApi, { FundLedgerData } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickDatePresets, DateInput, startOfYear, today, fmtDate, formatCurrency,
} from './_shared';

export default function FundLedgerPage() {
  const [startDate, setStartDate] = useState(startOfYear());
  const [endDate, setEndDate] = useState(today());
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
      fetchData(startOfYear(), today());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sd: string, ed: string) => { setStartDate(sd); setEndDate(ed); setPage(0); fetchData(sd, ed); };

  const d = state.data;
  const openingBalance   = d?.opening_balance   ?? 0;
  const totalCollections = d?.total_collections ?? d?.total_credits  ?? 0;
  const totalExpenses    = d?.total_expenses    ?? d?.total_debits   ?? 0;
  const totalOpeningFund = d?.total_opening_fund ?? 0;

  const balanceChartData = d?.entries.map(e => ({
    name: e.date
      ? new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : '',
    Balance: e.running_balance,
  })) ?? [];
  const footerCredit = d?.entries.reduce((s, e) => s + (e.entry_type !== 'debit' ? (e.credit || 0) : 0), 0) ?? 0;
  const footerDebit  = d?.entries.reduce((s, e) => s + (e.debit || 0), 0) ?? 0;

  const startIndex = page * pageSize;
  const paginatedEntries = d?.entries.slice(startIndex, startIndex + pageSize) ?? [];

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Fund Transactions"
          description="Complete transaction history with running balance"
          icon={BookOpen}
        />

        {/* Filter Block */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
          <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/40 dark:to-cyan-950/40 border-b border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">📖</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fund Transactions</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">• Complete transaction history</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex flex-wrap items-end gap-2">
              <DateInput label="Start Date" value={startDate} onChange={setStartDate} />
              <DateInput label="End Date" value={endDate} onChange={setEndDate} />
              <div className="flex-1 min-w-[200px]">
                <QuickDatePresets onSelect={applyPreset} />
              </div>
              <Button variant="primary" size="sm" onClick={() => { setPage(0); fetchData(startDate, endDate); }} disabled={state.loading} className="h-[34px]">
                {state.loading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                  : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
              </Button>
            </div>
          </div>
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
                    xaxis: { categories: balanceChartData.map((d: any) => d.name), labels: { style: { fontSize: '10px' }, rotate: -30 }, tickAmount: 8 },
                    yaxis: { labels: { formatter: (v: number) => `₹${(v / 1000).toFixed(0)}k`, style: { fontSize: '11px' } } },
                    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                    legend: { show: false },
                    grid: { borderColor: '#E2E8F0' },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-800 dark:bg-slate-950 text-white text-[11px] uppercase tracking-wider">
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap w-8">#</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Type</th>
                      <th className="px-3 py-3 text-right font-semibold whitespace-nowrap text-green-300">Credit (₹)</th>
                      <th className="px-3 py-3 text-right font-semibold whitespace-nowrap text-red-300">Debit (₹)</th>
                      <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Balance (₹)</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Reference</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
                          {d.entries.length === 0 ? 'No entries found for the selected range.' : 'No results on this page'}
                        </td>
                      </tr>
                    ) : paginatedEntries.map((e, idx) => {
                      const type = e.entry_type;
                      const isCredit      = type === 'credit';
                      const isOpeningFund = type === 'opening_fund';
                      const isDebit       = type === 'debit';
                      const isEven        = idx % 2 === 0;
                      const actualIndex   = startIndex + idx + 1;
                      return (
                        <tr
                          key={idx}
                          className={cn(
                            'border-b border-slate-100 dark:border-slate-700/60 transition-colors duration-100',
                            'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
                            isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/40'
                          )}
                        >
                          <td className="px-3 py-2.5 text-slate-400 dark:text-slate-600 text-xs tabular-nums">{actualIndex}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-xs font-mono text-slate-700 dark:text-slate-300">
                            {fmtDate(e.date)}
                          </td>
                          <td className="px-3 py-2.5">
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
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                            {(e.credit || 0) > 0
                              ? <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(e.credit)}</span>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                            {(e.debit || 0) > 0
                              ? <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(e.debit)}</span>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                            <span className={cn('font-bold text-sm', e.running_balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400')}>
                              {e.running_balance < 0 ? '(' : ''}{formatCurrency(Math.abs(e.running_balance))}{e.running_balance < 0 ? ')' : ''}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                            {e.reference || <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate italic">
                            {e.notes || <span className="text-slate-300 dark:text-slate-600 not-italic">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {d.entries.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                        <td colSpan={3} className="px-3 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                          Total ({d.entries.length} {d.entries.length === 1 ? 'entry' : 'entries'})
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-green-700 dark:text-green-400 tabular-nums whitespace-nowrap">
                          {formatCurrency(footerCredit)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-red-700 dark:text-red-400 tabular-nums whitespace-nowrap">
                          {formatCurrency(footerDebit)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                          {formatCurrency(d.closing_balance)}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>

            {d.entries.length > 25 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={d.entries.length}
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
