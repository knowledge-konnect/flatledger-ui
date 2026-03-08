import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FileText, TrendingUp, TrendingDown, Wallet, Users,
  Receipt, BarChart2, RefreshCw, AlertCircle, Loader2,
  BookOpen, CreditCard, PieChart as PieChartIcon,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { formatCurrency, cn } from '../lib/utils';
import reportsApi, {
  CollectionSummaryData, DefaulterEntry, IncomeVsExpenseData,
  FundLedgerData, PaymentRegisterEntry, PaymentRegisterPage, ExpenseByCategoryData,
} from '../api/reportsApi';

/* ─────────────────────────────────────────────────── */
/*  Helpers                                            */
/* ─────────────────────────────────────────────────── */

const today = () => new Date().toISOString().split('T')[0];
const startOfYear = () => new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
const currentYearMonth = () => new Date().toISOString().slice(0, 7);
const startYearMonth = () => `${new Date().getFullYear()}-01`;

// Date formatters for Payment Register ledger
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return `${String(d.getDate()).padStart(2,'0')} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return dateStr; }
};
const fmtPeriod = (periodStr: string): string => {
  try {
    const d = new Date(periodStr + '-01T00:00:00');
    return `${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return periodStr; }
};

// Quick preset helpers
function presetDate(preset: 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear'): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const tod = now.toISOString().split('T')[0];
  if (preset === 'thisMonth') {
    return { start: new Date(y, m, 1).toISOString().split('T')[0], end: tod };
  }
  if (preset === 'lastMonth') {
    const s = new Date(y, m - 1, 1);
    const e = new Date(y, m, 0);
    return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
  }
  if (preset === 'last3Months') {
    return { start: new Date(y, m - 2, 1).toISOString().split('T')[0], end: tod };
  }
  // thisYear
  return { start: new Date(y, 0, 1).toISOString().split('T')[0], end: tod };
}

function presetPeriod(preset: 'thisMonth' | 'thisQuarter' | 'thisYear'): { startPeriod: string; endPeriod: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const cur = now.toISOString().slice(0, 7);
  if (preset === 'thisMonth') {
    return { startPeriod: cur, endPeriod: cur };
  }
  if (preset === 'thisQuarter') {
    const qStart = Math.floor(m / 3) * 3;
    const sp = `${y}-${String(qStart + 1).padStart(2, '0')}`;
    return { startPeriod: sp, endPeriod: cur };
  }
  // thisYear
  return { startPeriod: `${y}-01`, endPeriod: cur };
}

interface ReportState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

function initialState<T>(): ReportState<T> {
  return { loading: false, error: null, data: null };
}

const CHART_COLORS = [
  '#6366F1', '#22C55E', '#F59E0B', '#EF4444',
  '#14B8A6', '#8B5CF6', '#EC4899', '#F97316',
];

/* ─────────────────────────────────────────────────── */
/*  Loading / Error placeholders                       */
/* ─────────────────────────────────────────────────── */

function ReportLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-sm">Loading {label}…</p>
    </div>
  );
}

function ReportError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
      <AlertCircle className="w-8 h-8" />
      <p className="text-sm font-medium">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Stat Card                                          */
/* ─────────────────────────────────────────────────── */

function StatCard({
  label, value, icon: Icon,
  colorClass = 'bg-indigo-50 dark:bg-indigo-950/30',
  iconColorClass = 'text-indigo-600 dark:text-indigo-400',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass?: string;
  iconColorClass?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-3.5">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
            <Icon className={cn('w-4.5 h-4.5', iconColorClass)} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 truncate uppercase tracking-wide">{label}</p>
            <p className="text-base font-bold text-slate-900 dark:text-white truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Quick Date Presets                                */
/* ─────────────────────────────────────────────────── */

const PRESET_DATE_LABELS = [
  { key: 'thisMonth',   label: 'This Month' },
  { key: 'lastMonth',   label: 'Last Month' },
  { key: 'last3Months', label: 'Last 3 Months' },
  { key: 'thisYear',    label: 'This Year' },
] as const;

const PRESET_PERIOD_LABELS = [
  { key: 'thisMonth',   label: 'This Month' },
  { key: 'thisQuarter', label: 'This Quarter' },
  { key: 'thisYear',    label: 'This Year' },
] as const;

function QuickDatePresets({
  onSelect,
}: {
  onSelect: (start: string, end: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mr-0.5">Quick:</span>
      {PRESET_DATE_LABELS.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => { const r = presetDate(p.key); onSelect(r.start, r.end); }}
          className="px-2 py-0.5 text-[11px] rounded-full border border-slate-300 dark:border-slate-600
                     text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:border-indigo-300
                     hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-700
                     dark:hover:text-indigo-400 transition-colors"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function QuickPeriodPresets({
  onSelect,
}: {
  onSelect: (startPeriod: string, endPeriod: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mr-0.5">Quick:</span>
      {PRESET_PERIOD_LABELS.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => { const r = presetPeriod(p.key); onSelect(r.startPeriod, r.endPeriod); }}
          className="px-2 py-0.5 text-[11px] rounded-full border border-slate-300 dark:border-slate-600
                     text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:border-indigo-300
                     hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-700
                     dark:hover:text-indigo-400 transition-colors"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function DateInput({
  label, value, onChange, type = 'date',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'date' | 'month';
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600
                   bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                   focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                   h-[34px]"
      />
    </div>
  );
}

function NumberInput({
  label, value, onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600
                   bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                   focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-36
                   h-[34px]"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  TAB 1 — Collection Summary                        */
/* ─────────────────────────────────────────────────── */

function CollectionSummaryReport({
  state, onFetch,
}: {
  state: ReportState<CollectionSummaryData>;
  onFetch: (sp: string, ep: string) => void;
}) {
  const [startPeriod, setStartPeriod] = useState(startYearMonth());
  const [endPeriod, setEndPeriod] = useState(currentYearMonth());
  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current && !state.data && !state.loading) {
      didFetch.current = true;
      onFetch(startPeriod, endPeriod);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sp: string, ep: string) => { setStartPeriod(sp); setEndPeriod(ep); onFetch(sp, ep); };

  if (state.loading) return <ReportLoading label="Collection Summary" />;
  if (state.error) return <ReportError message={state.error} onRetry={() => onFetch(startPeriod, endPeriod)} />;
  if (!state.data) return <ReportLoading label="Collection Summary" />;

  const d = state.data;
  const chartData = d.periods.map(p => ({
    name: p.period,
    Billed: p.total_billed,
    Collected: p.total_collected,
    Outstanding: p.total_outstanding,
  }));
  
  return (
    <div className="space-y-3">
      {/* Combined Filter & Description Block */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
        <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-b border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Billing & Collections Overview</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Period-wise billing & collections</span>
          </div>
        </div>
        <div className="p-3">
          <div className="flex flex-wrap items-end gap-2">
            <DateInput label="Start Period" value={startPeriod} onChange={setStartPeriod} type="month" />
            <DateInput label="End Period" value={endPeriod} onChange={setEndPeriod} type="month" />
            <div className="flex-1 min-w-[200px]">
              <QuickPeriodPresets onSelect={applyPreset} />
            </div>
            <Button variant="primary" size="sm" onClick={() => onFetch(startPeriod, endPeriod)} disabled={state.loading} className="h-[34px]">
              {state.loading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Billed" value={formatCurrency(d.total_billed)} icon={Wallet}
          colorClass="bg-blue-50 dark:bg-blue-950/30" iconColorClass="text-blue-600 dark:text-blue-400" />
        <StatCard label="Total Collected" value={formatCurrency(d.total_collected)} icon={TrendingUp}
          colorClass="bg-green-50 dark:bg-green-950/30" iconColorClass="text-green-600 dark:text-green-400" />
        <StatCard label="Total Outstanding" value={formatCurrency(d.total_outstanding)} icon={TrendingDown}
          colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
        <StatCard label="Total Flats" value={d.total_flats} icon={Users}
          colorClass="bg-purple-50 dark:bg-purple-950/30" iconColorClass="text-purple-600 dark:text-purple-400" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Billed" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Collected" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Outstanding" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Period-wise Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Billed</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Partial</TableHead>
                <TableHead>Unpaid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.periods.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-slate-400" colSpan={7}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : d.periods.map(p => (
                <TableRow key={p.period}>
                  <TableCell className="font-medium">{p.period}</TableCell>
                  <TableCell>{formatCurrency(p.total_billed)}</TableCell>
                  <TableCell className="text-green-600 dark:text-green-400">{formatCurrency(p.total_collected)}</TableCell>
                  <TableCell className={p.total_outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}>
                    {formatCurrency(p.total_outstanding)}
                  </TableCell>
                  <TableCell>{p.flats_paid}</TableCell>
                  <TableCell>{p.flats_partial}</TableCell>
                  <TableCell>{p.flats_unpaid}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  TAB 2 — Defaulters                                */
/* ─────────────────────────────────────────────────── */

function DefaultersReport({
  state, onFetch,
}: {
  state: ReportState<DefaulterEntry[]>;
  onFetch: (min: number) => void;
}) {
  const [minOutstanding, setMinOutstanding] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current && !state.data && !state.loading) {
      didFetch.current = true;
      onFetch(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.loading) return <ReportLoading label="Defaulters" />;
  if (state.error) return <ReportError message={state.error} onRetry={() => onFetch(minOutstanding)} />;
  if (!state.data) return <ReportLoading label="Defaulters" />;

  const allData = state.data!;
  const totalOutstanding = allData.reduce((s, d) => s + d.total_outstanding, 0);
  
  // Paginate the data
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = allData.slice(startIndex, endIndex);

  function rowClass(months: number) {
    if (months > 3) return 'bg-red-50 dark:bg-red-950/20';
    if (months >= 1) return 'bg-yellow-50 dark:bg-yellow-950/20';
    return '';
  }

  return (
    <div className="space-y-3">
      {/* Combined Filter & Description Block */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-amber-200 dark:border-amber-800 shadow-sm">
        <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Outstanding Dues Report</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">• Outstanding payments</span>
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
            <div className="flex-1"></div>
            <Button variant="primary" size="sm" onClick={() => { onFetch(minOutstanding); setPage(0); }} disabled={state.loading} className="h-[34px]">
              {state.loading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
            </Button>
          </div>
        </div>
      </div>

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
                <TableRow key={d.flat_no} className={rowClass(d.pending_months)}>
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

      {/* Pagination */}
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
  );
}

/* ─────────────────────────────────────────────────── */
/*  TAB 3 — Income vs Expense                         */
/* ─────────────────────────────────────────────────── */

function IncomeVsExpenseReport({
  state, onFetch,
}: {
  state: ReportState<IncomeVsExpenseData>;
  onFetch: (sd: string, ed: string) => void;
}) {
  const [startDate, setStartDate] = useState(startOfYear());
  const [endDate, setEndDate] = useState(today());
  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current && !state.data && !state.loading) {
      didFetch.current = true;
      onFetch(startOfYear(), today());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sd: string, ed: string) => { setStartDate(sd); setEndDate(ed); onFetch(sd, ed); };

  if (state.loading) return <ReportLoading label="Income vs Expense" />;
  if (state.error) return <ReportError message={state.error} onRetry={() => onFetch(startDate, endDate)} />;
  if (!state.data) return <ReportLoading label="Income vs Expense" />;

  const d = state.data!;
  const chartData = d.months.map(m => ({
    name: m.month,
    Income: m.income,
    Expense: m.expense,
    Net: m.net,
  }));

  return (
    <div className="space-y-3">
      {/* Combined Filter & Description Block */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm">
        <div className="px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-b border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Income vs Expense Analysis</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Track financial health</span>
          </div>
        </div>
        <div className="p-3">
          <div className="flex flex-wrap items-end gap-2">
            <DateInput label="Start Date" value={startDate} onChange={setStartDate} />
            <DateInput label="End Date" value={endDate} onChange={setEndDate} />
            <div className="flex-1 min-w-[200px]">
              <QuickDatePresets onSelect={applyPreset} />
            </div>
            <Button variant="primary" size="sm" onClick={() => onFetch(startDate, endDate)} disabled={state.loading} className="h-[34px]">
              {state.loading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total Income" value={formatCurrency(d.total_income)} icon={TrendingUp}
          colorClass="bg-green-50 dark:bg-green-950/30" iconColorClass="text-green-600 dark:text-green-400" />
        <StatCard label="Total Expense" value={formatCurrency(d.total_expense)} icon={TrendingDown}
          colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
        <StatCard
          label="Net Balance"
          value={formatCurrency(d.net_balance)}
          icon={d.net_balance >= 0 ? TrendingUp : TrendingDown}
          colorClass={d.net_balance >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}
          iconColorClass={d.net_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Monthly Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Net Balance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="Net" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Expense</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.months.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-slate-400" colSpan={4}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : d.months.map(m => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">{m.month}</TableCell>
                  <TableCell className="text-green-600 dark:text-green-400">{formatCurrency(m.income)}</TableCell>
                  <TableCell className="text-red-600 dark:text-red-400">{formatCurrency(m.expense)}</TableCell>
                  <TableCell className={cn('font-semibold', m.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    {m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  TAB 4 — Fund Ledger                               */
/* ─────────────────────────────────────────────────── */

function FundLedgerReport({
  state, onFetch,
}: {
  state: ReportState<FundLedgerData>;
  onFetch: (sd: string, ed: string) => void;
}) {
  const [startDate, setStartDate] = useState(startOfYear());
  const [endDate, setEndDate] = useState(today());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current && !state.data && !state.loading) {
      didFetch.current = true;
      onFetch(startOfYear(), today());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sd: string, ed: string) => { setStartDate(sd); setEndDate(ed); setPage(0); onFetch(sd, ed); };

  if (state.loading) return <ReportLoading label="Fund Ledger" />;
  if (state.error) return <ReportError message={state.error} onRetry={() => onFetch(startDate, endDate)} />;
  if (!state.data) return <ReportLoading label="Fund Ledger" />;

  const d = state.data!;
  const openingBalance   = d.opening_balance   ?? 0;
  const totalCollections = d.total_collections ?? d.total_credits  ?? 0;
  const totalExpenses    = d.total_expenses    ?? d.total_debits   ?? 0;
  const totalOpeningFund = d.total_opening_fund ?? 0;

  const balanceChartData = d.entries.map(e => ({
    name: e.date,
    Balance: e.running_balance,
  }));

  // Total credit / debit / opening_fund from entries for the footer
  const footerCredit  = d.entries.reduce((s, e) => s + (e.entry_type !== 'debit' ? (e.credit || 0) : 0), 0);
  const footerDebit   = d.entries.reduce((s, e) => s + (e.debit || 0), 0);

  // Pagination
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEntries = d.entries.slice(startIndex, endIndex);

  return (
    <div className="space-y-3">
      {/* Combined Filter & Description Block */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fund Transaction History</h3>
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
            <Button variant="primary" size="sm" onClick={() => { setPage(0); onFetch(startDate, endDate); }} disabled={state.loading} className="h-[34px]">
              {state.loading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Opening Balance" value={formatCurrency(openingBalance)} icon={Wallet}
          colorClass="bg-slate-50 dark:bg-slate-800/40" iconColorClass="text-slate-500 dark:text-slate-400" />
        <StatCard label="Opening Fund" value={formatCurrency(totalOpeningFund)} icon={BookOpen}
          colorClass="bg-indigo-50 dark:bg-indigo-950/30" iconColorClass="text-indigo-600 dark:text-indigo-400" />
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
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={balanceChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="Balance" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Fund Ledger Table ── */}
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
                      'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
                      isEven
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/70 dark:bg-slate-800/40'
                    )}
                  >
                    <td className="px-3 py-2.5 text-slate-400 dark:text-slate-600 text-xs tabular-nums">{actualIndex}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-mono text-slate-700 dark:text-slate-300">
                      {fmtDate(e.date)}
                    </td>
                    <td className="px-3 py-2.5">
                      {isCredit && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 whitespace-nowrap">
                          Credit
                        </span>
                      )}
                      {isDebit && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 whitespace-nowrap">
                          Debit
                        </span>
                      )}
                      {isOpeningFund && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 whitespace-nowrap">
                          Opening Fund
                        </span>
                      )}
                      {!isCredit && !isDebit && !isOpeningFund && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {type}
                        </span>
                      )}
                    </td>
                    {/* Credit */}
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {(e.credit || 0) > 0
                        ? <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(e.credit)}</span>
                        : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    {/* Debit */}
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {(e.debit || 0) > 0
                        ? <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(e.debit)}</span>
                        : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    {/* Running balance — colour by sign */}
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                      <span className={cn(
                        'font-bold text-sm',
                        e.running_balance >= 0
                          ? 'text-slate-900 dark:text-white'
                          : 'text-red-600 dark:text-red-400'
                      )}>
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

      {/* Pagination */}
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
  );
}

/* ─────────────────────────────────────────────────── */
/*  TAB 5 — Payment Register                          */
/* ─────────────────────────────────────────────────── */

const PERIOD_LABEL_FILTER_OPTIONS = ['All', 'Current', 'Arrear', 'Advance'] as const;

// One grouped row = one flat's payments on one date
interface GroupedPaymentRow {
  key:             string;
  date_paid:       string;
  flat_no:         string;
  owner_name:      string;
  current:         number;   // sum of Current-label payments
  arrear:          number;   // sum of Arrear-label payments
  advance:         number;   // sum of Advance-label payments
  unlinked:        number;   // sum of null-label payments (e.g. Opening Balance)
  unlinked_notes:  string[]; // notes from unlinked entries
  total:           number;
  modes:           string[];
  recorded_by:     string;
}

// Normalize period_label to canonical casing regardless of what the API returns
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
        current:  0, arrear:   0, advance:  0,
        unlinked: 0, unlinked_notes: [],
        total: 0, modes: [], recorded_by: p.recorded_by ?? '—',
      };
    }
    const g   = map[key];
    const lbl = normalizePeriodLabel(p.period_label);
    const amt = Number(p.amount) || 0;          // guard against string amounts from API
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

function PaymentRegisterReport({
  state, onFetch,
}: {
  state: ReportState<PaymentRegisterPage>;
  onFetch: (sd: string, ed: string, page?: number, pageSize?: number) => void;
}) {
  const [startDate, setStartDate] = useState(startOfYear());
  const [endDate, setEndDate] = useState(today());
  const [labelFilter, setLabelFilter] = useState<typeof PERIOD_LABEL_FILTER_OPTIONS[number]>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current && !state.data && !state.loading) {
      didFetch.current = true;
      onFetch(startOfYear(), today(), 1, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sd: string, ed: string) => {
    setStartDate(sd); setEndDate(ed);
    setPage(1);
    onFetch(sd, ed, 1, pageSize);
  };

  const goToPage = (p: number) => {
    setPage(p);
    onFetch(startDate, endDate, p, pageSize);
  };

  const changePageSize = (ps: number) => {
    setPageSize(ps);
    setPage(1);
    onFetch(startDate, endDate, 1, ps);
  };

  if (state.loading) return <ReportLoading label="Payment Register" />;
  if (state.error)   return <ReportError message={state.error} onRetry={() => onFetch(startDate, endDate, page, pageSize)} />;
  if (!state.data)   return <ReportLoading label="Payment Register" />;

  const entries = state.data.entries ?? [];
  const totalCount = state.data.total ?? 0;
  const currentPage = state.data.page ?? page;
  const currentPageSize = state.data.pageSize ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentPageSize));

  const allGrouped = buildGroupedRows(entries);

  // Filter groups: "Current" = group had at least one current payment, etc.
  const rows = labelFilter === 'All' ? allGrouped : allGrouped.filter(g => {
    if (labelFilter === 'Current') return g.current > 0;
    if (labelFilter === 'Arrear')  return g.arrear  > 0;
    if (labelFilter === 'Advance') return g.advance > 0;
    return true;
  });

  const totalCurrent = rows.reduce((s, g) => s + g.current,  0);
  const totalArrear  = rows.reduce((s, g) => s + g.arrear,   0);
  const totalAdvance = rows.reduce((s, g) => s + g.advance,  0);
  const totalAmount  = rows.reduce((s, g) => s + g.total,    0);

  // Pie chart built from grouped mode totals
  const modeMap: Record<string, number> = {};
  rows.forEach(g => g.modes.forEach(m => { modeMap[m] = (modeMap[m] || 0) + g.total; }));
  const pieData = Object.entries(modeMap).map(([name, value]) => ({ name, value }));

  // Flat individual entries for the ledger table (filtered)
  const flatRows = labelFilter === 'All' ? entries : entries.filter(p => {
    const lbl = normalizePeriodLabel(p.period_label);
    if (labelFilter === 'Current') return lbl === 'Current';
    if (labelFilter === 'Arrear')  return lbl === 'Arrear';
    if (labelFilter === 'Advance') return lbl === 'Advance';
    return true;
  });
  const flatTotal = flatRows.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-3">
      {/* Combined Filter & Description Block */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-purple-200 dark:border-purple-800 shadow-sm">
        <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-b border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">💳</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Payment Receipts Register</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Individual payment records</span>
          </div>
        </div>
        <div className="p-3">
          <div className="flex flex-wrap items-end gap-2">
            <DateInput label="Start Date" value={startDate} onChange={setStartDate} />
            <DateInput label="End Date" value={endDate} onChange={setEndDate} />
            <div className="flex-1 min-w-[200px]">
              <QuickDatePresets onSelect={applyPreset} />
            </div>
            <Button variant="primary" size="sm" onClick={() => { setPage(1); onFetch(startDate, endDate, 1, pageSize); }} disabled={state.loading} className="h-[34px]">
              {state.loading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Period label filter */}
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

      {/* Side-by-Side: Pie Chart + KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-3">
        {/* Left: Pie Chart */}
        {pieData.length > 0 && (
          <Card className="lg:w-[340px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Payment Mode Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col items-center gap-3">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
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

        {/* Right: Compact KPI Cards in 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50 dark:bg-indigo-950/30">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Collected</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-50 dark:bg-green-950/30">
                    <Receipt className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalCurrent)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50 dark:bg-amber-950/30">
                    <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Arrear</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalArrear)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 dark:bg-blue-950/30">
                    <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Advance</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalAdvance)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Payment Ledger Table ── */}
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
                      isEven
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/70 dark:bg-slate-800/40'
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
                      {p.reference
                        ? p.reference
                        : p.notes
                          ? <span className="italic">{p.notes}</span>
                          : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      {p.period ? fmtPeriod(p.period) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {lbl === 'Current' && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 whitespace-nowrap">
                          Current
                        </span>
                      )}
                      {lbl === 'Arrear' && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 whitespace-nowrap">
                          Arrear
                        </span>
                      )}
                      {lbl === 'Advance' && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 whitespace-nowrap">
                          Advance
                        </span>
                      )}
                      {lbl === null && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 whitespace-nowrap">
                          Opening
                        </span>
                      )}
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

      {/* ── Pagination Controls ── */}
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
            >
              ← Prev
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  TAB 6 — Expense by Category                       */
/* ─────────────────────────────────────────────────── */

function ExpenseByCategoryReport({
  state, onFetch,
}: {
  state: ReportState<ExpenseByCategoryData>;
  onFetch: (sd: string, ed: string) => void;
}) {
  const [startDate, setStartDate] = useState(startOfYear());
  const [endDate, setEndDate] = useState(today());
  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current && !state.data && !state.loading) {
      didFetch.current = true;
      onFetch(startOfYear(), today());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sd: string, ed: string) => { setStartDate(sd); setEndDate(ed); onFetch(sd, ed); };

  if (state.loading) return <ReportLoading label="Expense by Category" />;
  if (state.error) return <ReportError message={state.error} onRetry={() => onFetch(startDate, endDate)} />;
  if (!state.data) return <ReportLoading label="Expense by Category" />;

  const d = state.data!;
  const pieData = d.categories.map(c => ({ name: c.category, value: c.total_amount }));

  return (
    <div className="space-y-3">
      {/* Combined Filter & Description Block */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-rose-200 dark:border-rose-800 shadow-sm">
        <div className="px-4 py-2.5 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 border-b border-rose-200 dark:border-rose-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏷️</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Category-wise Expense Analysis</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Spending analysis</span>
          </div>
        </div>
        <div className="p-3">
          <div className="flex flex-wrap items-end gap-2">
            <DateInput label="Start Date" value={startDate} onChange={setStartDate} />
            <DateInput label="End Date" value={endDate} onChange={setEndDate} />
            <div className="flex-1 min-w-[200px]">
              <QuickDatePresets onSelect={applyPreset} />
            </div>
            <Button variant="primary" size="sm" onClick={() => onFetch(startDate, endDate)} disabled={state.loading} className="h-[34px]">
              {state.loading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard label="Total Expense" value={formatCurrency(d.total_expense)} icon={TrendingDown}
          colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
        <StatCard label="Categories" value={d.categories.length} icon={PieChartIcon}
          colorClass="bg-purple-50 dark:bg-purple-950/30" iconColorClass="text-purple-600 dark:text-purple-400" />
      </div>

      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={((props: any) => `${((props.percent ?? 0) * 100).toFixed(0)}%`) as any}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {d.categories.map((c, i) => (
                  <div key={c.category_code} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{c.category}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white ml-auto pl-2 flex-shrink-0">
                      {formatCurrency(c.total_amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>No. of Entries</TableHead>
                <TableHead>First Expense</TableHead>
                <TableHead>Last Expense</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.categories.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-slate-400" colSpan={6}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : d.categories.map((c, i) => (
                <TableRow key={c.category_code}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="font-medium">{c.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {c.category_code}
                    </span>
                  </TableCell>
                  <TableCell className="text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(c.total_amount)}
                  </TableCell>
                  <TableCell>{c.total_entries}</TableCell>
                  <TableCell className="text-slate-500">{c.first_expense_date}</TableCell>
                  <TableCell className="text-slate-500">{c.last_expense_date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Tab definitions                                    */
/* ─────────────────────────────────────────────────── */

const TABS = [
  { key: 'collectionSummary', label: 'Billing & Collections Overview', icon: BarChart2 },
  { key: 'defaulters',        label: 'Outstanding Dues Report',         icon: Users },
  { key: 'incomeVsExpense',   label: 'Income vs Expense Analysis',  icon: TrendingUp },
  { key: 'fundLedger',        label: 'Fund Transaction History',        icon: BookOpen },
  { key: 'paymentRegister',   label: 'Payment Receipts Register',   icon: CreditCard },
  { key: 'expenseByCategory', label: 'Category-wise Expense Analysis', icon: PieChartIcon },
] as const;

type TabKey = typeof TABS[number]['key'];

/* ─────────────────────────────────────────────────── */
/*  Main Page Component                                */
/* ─────────────────────────────────────────────────── */

interface AllReports {
  collectionSummary: ReportState<CollectionSummaryData>;
  defaulters: ReportState<DefaulterEntry[]>;
  incomeVsExpense: ReportState<IncomeVsExpenseData>;
  fundLedger: ReportState<FundLedgerData>;
  paymentRegister: ReportState<PaymentRegisterPage>;
  expenseByCategory: ReportState<ExpenseByCategoryData>;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabKey>('collectionSummary');

  const [reports, setReports] = useState<AllReports>({
    collectionSummary: initialState(),
    defaulters: initialState(),
    incomeVsExpense: initialState(),
    fundLedger: initialState(),
    paymentRegister: initialState(),
    expenseByCategory: initialState(),
  });

  const setLoading = useCallback((key: keyof AllReports) => {
    setReports(prev => ({ ...prev, [key]: { loading: true, error: null, data: null } }));
  }, []);

  const setSuccess = useCallback(<K extends keyof AllReports>(key: K, data: AllReports[K]['data']) => {
    setReports(prev => ({ ...prev, [key]: { loading: false, error: null, data } }));
  }, []);

  const setError = useCallback((key: keyof AllReports, msg: string) => {
    setReports(prev => ({ ...prev, [key]: { loading: false, error: msg, data: null } }));
  }, []);

  const fetchCollectionSummary = useCallback((startPeriod = startYearMonth(), endPeriod = currentYearMonth()) => {
    setLoading('collectionSummary');
    reportsApi.getCollectionSummary(startPeriod, endPeriod)
      .then(d => setSuccess('collectionSummary', d))
      .catch(e => setError('collectionSummary', e?.response?.data?.message || e?.message || 'Failed to load'));
  }, [setLoading, setSuccess, setError]);

  const fetchDefaulters = useCallback((minOutstanding = 0) => {
    setLoading('defaulters');
    reportsApi.getDefaulters(minOutstanding)
      .then(d => setSuccess('defaulters', d))
      .catch(e => setError('defaulters', e?.response?.data?.message || e?.message || 'Failed to load'));
  }, [setLoading, setSuccess, setError]);

  const fetchIncomeVsExpense = useCallback((startDate = startOfYear(), endDate = today()) => {
    setLoading('incomeVsExpense');
    reportsApi.getIncomeVsExpense(startDate, endDate)
      .then(d => setSuccess('incomeVsExpense', d))
      .catch(e => setError('incomeVsExpense', e?.response?.data?.message || e?.message || 'Failed to load'));
  }, [setLoading, setSuccess, setError]);

  const fetchFundLedger = useCallback((startDate = startOfYear(), endDate = today()) => {
    setLoading('fundLedger');
    reportsApi.getFundLedger(startDate, endDate)
      .then(d => setSuccess('fundLedger', d))
      .catch(e => setError('fundLedger', e?.response?.data?.message || e?.message || 'Failed to load'));
  }, [setLoading, setSuccess, setError]);

  const fetchPaymentRegister = useCallback((startDate = startOfYear(), endDate = today(), page = 1, pageSize = 25) => {
    setLoading('paymentRegister');
    reportsApi.getPaymentRegister(startDate, endDate, page, pageSize)
      .then(d => setSuccess('paymentRegister', d))
      .catch(e => setError('paymentRegister', e?.response?.data?.message || e?.message || 'Failed to load'));
  }, [setLoading, setSuccess, setError]);

  const fetchExpenseByCategory = useCallback((startDate = startOfYear(), endDate = today()) => {
    setLoading('expenseByCategory');
    reportsApi.getExpenseByCategory(startDate, endDate)
      .then(d => setSuccess('expenseByCategory', d))
      .catch(e => setError('expenseByCategory', e?.response?.data?.message || e?.message || 'Failed to load'));
  }, [setLoading, setSuccess, setError]);

  // Reports are lazy-loaded: each tab component fetches on first mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {}, []);

  function tabIndicator(key: keyof AllReports) {
    if (reports[key].loading)
      return <span className="ml-1.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse inline-block" />;
    if (reports[key].error)
      return <span className="ml-1.5 w-2 h-2 rounded-full bg-red-400 inline-block" />;
    return null;
  }

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Financial Reports"
          description="Analyze collections, expenses, and payment trends"
          icon={FileText}
        />

        {/* Tab Navigation */}
        <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex gap-1 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                    isActive
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                  {tabIndicator(tab.key)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-200">
          {activeTab === 'collectionSummary' && (
            <CollectionSummaryReport state={reports.collectionSummary} onFetch={fetchCollectionSummary} />
          )}
          {activeTab === 'defaulters' && (
            <DefaultersReport state={reports.defaulters} onFetch={fetchDefaulters} />
          )}
          {activeTab === 'incomeVsExpense' && (
            <IncomeVsExpenseReport state={reports.incomeVsExpense} onFetch={fetchIncomeVsExpense} />
          )}
          {activeTab === 'fundLedger' && (
            <FundLedgerReport state={reports.fundLedger} onFetch={fetchFundLedger} />
          )}
          {activeTab === 'paymentRegister' && (
            <PaymentRegisterReport state={reports.paymentRegister} onFetch={fetchPaymentRegister} />
          )}
          {activeTab === 'expenseByCategory' && (
            <ExpenseByCategoryReport state={reports.expenseByCategory} onFetch={fetchExpenseByCategory} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
