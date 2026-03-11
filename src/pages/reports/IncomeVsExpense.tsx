import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, AreaChart, Area, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { cn } from '../../lib/utils';
import reportsApi, { IncomeVsExpenseData } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickDatePresets, DateInput, startOfYear, today, formatCurrency,
} from './_shared';

export default function IncomeVsExpensePage() {
  const [startDate, setStartDate] = useState(startOfYear());
  const [endDate, setEndDate] = useState(today());
  const [state, setState] = useState<ReportState<IncomeVsExpenseData>>(initialState());

  const fetchData = useCallback((sd: string, ed: string) => {
    setState({ loading: true, error: null, data: null });
    reportsApi.getIncomeVsExpense(sd, ed)
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

  const applyPreset = (sd: string, ed: string) => { setStartDate(sd); setEndDate(ed); fetchData(sd, ed); };

  const chartData = state.data?.months.map(m => ({
    name: m.month,
    Income: m.income,
    Expense: m.expense,
    Net: m.net,
  })) ?? [];

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Income & Expenses"
          description="Monthly income, expenses, and net balance trends"
          icon={TrendingUp}
        />

        {/* Filter Block */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm">
          <div className="px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-b border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Income &amp; Expenses</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">• Monthly financial health</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex flex-wrap items-end gap-2">
              <DateInput label="Start Date" value={startDate} onChange={setStartDate} />
              <DateInput label="End Date" value={endDate} onChange={setEndDate} />
              <div className="flex-1 min-w-[200px]">
                <QuickDatePresets onSelect={applyPreset} />
              </div>
              <Button variant="primary" size="sm" onClick={() => fetchData(startDate, endDate)} disabled={state.loading} className="h-[34px]">
                {state.loading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                  : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
              </Button>
            </div>
          </div>
        </div>

        {state.loading && <ReportLoading label="Income vs Expense" />}
        {state.error && <ReportError message={state.error} onRetry={() => fetchData(startDate, endDate)} />}
        {state.data && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Total Income" value={formatCurrency(state.data.total_income)} icon={TrendingUp}
                colorClass="bg-green-50 dark:bg-green-950/30" iconColorClass="text-green-600 dark:text-green-400" />
              <StatCard label="Total Expense" value={formatCurrency(state.data.total_expense)} icon={TrendingDown}
                colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
              <StatCard
                label="Net Balance"
                value={formatCurrency(state.data.net_balance)}
                icon={state.data.net_balance >= 0 ? TrendingUp : TrendingDown}
                colorClass={state.data.net_balance >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}
                iconColorClass={state.data.net_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
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
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="4 2" label={{ value: 'Break-even', position: 'insideTopRight', fontSize: 10, fill: '#94A3B8' }} />
                    <Area type="monotone" dataKey="Net" stroke="#6366F1" strokeWidth={2.5} fill="url(#netGradient)" dot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
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
                    {state.data.months.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center py-8 text-slate-400" colSpan={4}>
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : state.data.months.map(m => (
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
        )}
      </div>
    </DashboardLayout>
  );
}
