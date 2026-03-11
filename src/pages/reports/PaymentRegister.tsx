import { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, TrendingUp, Receipt, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import reportsApi, { PaymentRegisterEntry } from '../../api/reportsApi';
import type { PaymentRegisterPage } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError,
  QuickDatePresets, DateInput, startOfYear, today, fmtDate, fmtPeriod, CHART_COLORS, formatCurrency,
} from './_shared';

/* ─── Payment Register helpers ─── */

const PERIOD_LABEL_FILTER_OPTIONS = ['All', 'Current', 'Arrear', 'Advance'] as const;

interface GroupedPaymentRow {
  key:            string;
  date_paid:      string;
  flat_no:        string;
  owner_name:     string;
  current:        number;
  arrear:         number;
  advance:        number;
  unlinked:       number;
  unlinked_notes: string[];
  total:          number;
  modes:          string[];
  recorded_by:    string;
}

function normalizePeriodLabel(raw: unknown): 'Current' | 'Arrear' | 'Advance' | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === 'current') return 'Current';
  if (s === 'arrear')  return 'Arrear';
  if (s === 'advance') return 'Advance';
  return null;
}

function buildGroupedRows(rows: PaymentRegisterEntry[]): GroupedPaymentRow[] {
  const map: Record<string, GroupedPaymentRow> = {};
  rows.forEach(p => {
    const key = `${p.date_paid ?? 'null'}_${p.flat_no}`;
    if (!map[key]) {
      map[key] = {
        key,
        date_paid:      p.date_paid ?? '—',
        flat_no:        p.flat_no,
        owner_name:     p.owner_name,
        current: 0, arrear: 0, advance: 0,
        unlinked: 0, unlinked_notes: [],
        total: 0, modes: [], recorded_by: p.recorded_by ?? '—',
      };
    }
    const g   = map[key];
    const lbl = normalizePeriodLabel(p.period_label);
    const amt = Number(p.amount) || 0;
    if      (lbl === 'Current') g.current += amt;
    else if (lbl === 'Arrear')  g.arrear  += amt;
    else if (lbl === 'Advance') g.advance += amt;
    else {
      g.unlinked += amt;
      if (p.notes) g.unlinked_notes.push(p.notes);
    }
    g.total += amt;
    if (p.payment_mode && !g.modes.includes(p.payment_mode)) g.modes.push(p.payment_mode);
  });
  return Object.values(map);
}

/* ─── Page component ─── */

export default function PaymentRegisterPage() {
  const [startDate, setStartDate] = useState(startOfYear());
  const [endDate, setEndDate] = useState(today());
  const [labelFilter, setLabelFilter] = useState<typeof PERIOD_LABEL_FILTER_OPTIONS[number]>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [state, setState] = useState<ReportState<PaymentRegisterPage>>(initialState());

  const fetchData = useCallback((sd: string, ed: string, pg = 1, ps = 50) => {
    setState({ loading: true, error: null, data: null });
    reportsApi.getPaymentRegister(sd, ed, pg, ps)
      .then(d => setState({ loading: false, error: null, data: d }))
      .catch(e => setState({ loading: false, error: e?.response?.data?.message || e?.message || 'Failed to load', data: null }));
  }, []);

  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchData(startOfYear(), today(), 1, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sd: string, ed: string) => {
    setStartDate(sd); setEndDate(ed); setPage(1);
    fetchData(sd, ed, 1, pageSize);
  };
  const goToPage = (p: number) => { setPage(p); fetchData(startDate, endDate, p, pageSize); };
  const changePageSize = (ps: number) => { setPageSize(ps); setPage(1); fetchData(startDate, endDate, 1, ps); };

  const entries = state.data?.entries ?? [];
  const totalCount = state.data?.total ?? 0;
  const currentPage = state.data?.page ?? page;
  const currentPageSize = state.data?.pageSize ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentPageSize));

  const allGrouped = buildGroupedRows(entries);
  const rows = labelFilter === 'All' ? allGrouped : allGrouped.filter(g => {
    if (labelFilter === 'Current') return g.current > 0;
    if (labelFilter === 'Arrear')  return g.arrear  > 0;
    if (labelFilter === 'Advance') return g.advance > 0;
    return true;
  });

  const totalCurrent = rows.reduce((s, g) => s + g.current, 0);
  const totalArrear  = rows.reduce((s, g) => s + g.arrear, 0);
  const totalAdvance = rows.reduce((s, g) => s + g.advance, 0);
  const totalAmount  = rows.reduce((s, g) => s + g.total, 0);

  const modeMap: Record<string, number> = {};
  rows.forEach(g => g.modes.forEach(m => { modeMap[m] = (modeMap[m] || 0) + g.total; }));
  const pieData = Object.entries(modeMap).map(([name, value]) => ({ name, value }));

  const flatRows = labelFilter === 'All' ? entries : entries.filter(p => {
    const lbl = normalizePeriodLabel(p.period_label);
    if (labelFilter === 'Current') return lbl === 'Current';
    if (labelFilter === 'Arrear')  return lbl === 'Arrear';
    if (labelFilter === 'Advance') return lbl === 'Advance';
    return true;
  });
  const flatTotal = flatRows.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Payments Received"
          description="All payment receipts grouped by date and flat"
          icon={CreditCard}
        />

        {/* Filter Block */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-purple-200 dark:border-purple-800 shadow-sm">
          <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-b border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">💳</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Payments Received</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">• All payment receipts</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex flex-wrap items-end gap-2">
              <DateInput label="Start Date" value={startDate} onChange={setStartDate} />
              <DateInput label="End Date" value={endDate} onChange={setEndDate} />
              <div className="flex-1 min-w-[200px]">
                <QuickDatePresets onSelect={applyPreset} />
              </div>
              <Button variant="primary" size="sm" onClick={() => { setPage(1); fetchData(startDate, endDate, 1, pageSize); }} disabled={state.loading} className="h-[34px]">
                {state.loading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                  : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
              </Button>
            </div>
          </div>
        </div>

        {state.loading && <ReportLoading label="Payment Register" />}
        {state.error && <ReportError message={state.error} onRetry={() => fetchData(startDate, endDate, page, pageSize)} />}
        {state.data && (
          <div className="space-y-3">
            {/* Label filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500 dark:text-slate-400">Show:</span>
              {PERIOD_LABEL_FILTER_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setLabelFilter(opt)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors duration-200 ${
                    labelFilter === opt
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Pie + KPI cards */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-3">
              {pieData.length > 0 && (
                <Card className="lg:w-[340px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Payment Mode Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex flex-col items-center gap-3">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                            label={((({ percent }: any) => percent && percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : '') as any)} labelLine={false}>
                            {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-1.5 w-full">
                        {pieData.map((entry, i) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-xs text-slate-700 dark:text-slate-300">{entry.name}</span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white ml-auto">{formatCurrency(entry.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Total Collected', value: totalAmount, icon: TrendingUp, bg: 'bg-indigo-50 dark:bg-indigo-950/30', ic: 'text-indigo-600 dark:text-indigo-400' },
                  { label: 'Current', value: totalCurrent, icon: Receipt, bg: 'bg-green-50 dark:bg-green-950/30', ic: 'text-green-600 dark:text-green-400' },
                  { label: 'Arrear', value: totalArrear, icon: Receipt, bg: 'bg-amber-50 dark:bg-amber-950/30', ic: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Advance', value: totalAdvance, icon: Receipt, bg: 'bg-blue-50 dark:bg-blue-950/30', ic: 'text-blue-600 dark:text-blue-400' },
                ].map(({ label, value, icon: Icon, bg, ic }) => (
                  <Card key={label} className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                            <Icon className={`w-4 h-4 ${ic}`} />
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(value)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Payment ledger table */}
            <Card>
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-800 dark:bg-slate-950 text-white text-[11px] uppercase tracking-wider">
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap w-8">#</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Flat</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Owner</th>
                      <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Amount (₹)</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Mode</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Ref / Notes</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Period</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Type</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
                          No payments found for the selected criteria.
                        </td>
                      </tr>
                    ) : flatRows.map((p, idx) => {
                      const lbl = normalizePeriodLabel(p.period_label);
                      const isEven = idx % 2 === 0;
                      return (
                        <tr
                          key={idx}
                          className={cn(
                            'border-b border-slate-100 dark:border-slate-700/60 transition-colors duration-100',
                            'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
                            isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/40'
                          )}
                        >
                          <td className="px-3 py-2.5 text-slate-400 dark:text-slate-600 text-xs tabular-nums">{idx + 1}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-xs font-mono text-slate-700 dark:text-slate-300">
                            {p.date_paid ? fmtDate(p.date_paid) : '—'}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">{p.flat_no}</td>
                          <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{p.owner_name}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                            {formatCurrency(Number(p.amount) || 0)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                              {p.payment_mode}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs max-w-[180px] truncate">
                            {p.reference ? p.reference : p.notes ? <span className="italic">{p.notes}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                            {p.period ? fmtPeriod(p.period) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            {lbl === 'Current' && <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 whitespace-nowrap">Current</span>}
                            {lbl === 'Arrear'  && <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 whitespace-nowrap">Arrear</span>}
                            {lbl === 'Advance' && <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 whitespace-nowrap">Advance</span>}
                            {lbl === null      && <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 whitespace-nowrap">Opening</span>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{p.recorded_by}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {flatRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                        <td colSpan={4} className="px-3 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                          Page total ({flatRows.length} {flatRows.length === 1 ? 'entry' : 'entries'} of {totalCount})
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(flatTotal)}
                        </td>
                        <td colSpan={5} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>Rows per page:</span>
                  {[10, 25, 50, 100].map(ps => (
                    <button
                      key={ps}
                      onClick={() => changePageSize(ps)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors duration-150 ${
                        currentPageSize === ps
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                      }`}
                    >
                      {ps}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">
                    Page {currentPage} of {totalPages} &bull; {totalCount} total records
                  </span>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                    className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >← Prev</button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
