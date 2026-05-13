import { useState, useEffect, useCallback, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { TrendingUp, TrendingDown, Loader2, RefreshCw, Percent } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { cn } from '../../lib/utils';
import { axisLabelStyle, baseChartOptions, baseGrid, currencyK, currencyTooltip } from '../../lib/chartOptions';
import reportsApi, { IncomeVsExpenseData, ExpenseCategory } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickDatePresets, startOfMonth, today, CHART_COLORS, formatCurrency, fmtPeriod, DatePresetKey,
} from './_shared';
import { useSocietyPeriodBounds } from '../../hooks/useSocietyPeriodBounds';

export default function IncomeVsExpensePage() {
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [activeDatePreset, setActiveDatePreset] = useState<DatePresetKey | null>('thisMonth');
  const [state, setState] = useState<ReportState<IncomeVsExpenseData>>(initialState());
  const { minDate, maxDate, clampDate } = useSocietyPeriodBounds();

  useEffect(() => {
    const nextStart = clampDate(startDate);
    const nextEnd = clampDate(endDate);
    if (nextStart !== startDate) setStartDate(nextStart);
    if (nextEnd !== endDate) setEndDate(nextEnd);
  }, [startDate, endDate, clampDate]);

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
      fetchData(startOfMonth(), today());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (preset: DatePresetKey, sd: string, ed: string) => {
    const safeStart = clampDate(sd);
    const safeEnd = clampDate(ed);
    setActiveDatePreset(preset);
    setStartDate(safeStart);
    setEndDate(safeEnd);
    fetchData(safeStart, safeEnd);
  };

  const monthsAsc = [...(state.data?.months ?? [])].sort((a, b) => a.month.localeCompare(b.month));
  const monthsDesc = [...monthsAsc].reverse();

  const chartData = monthsAsc.map(m => ({
    name: fmtPeriod(m.month),
    Income: m.income,
    Expense: m.expense,
    Net: m.net,
  }));

  const expRatio = state.data && state.data.total_income > 0
    ? (state.data.total_expense / state.data.total_income) * 100 : 0;
  const catSorted = [...(state.data?.categories ?? [])].sort(
    (a: ExpenseCategory, b: ExpenseCategory) => b.total_amount - a.total_amount
  );
  const catTotal = state.data?.total_expense
    || catSorted.reduce((s: number, c: ExpenseCategory) => s + c.total_amount, 0);

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Income & Expenses"
          description="Monthly income, expenses, and net balance trends"
          icon={TrendingUp}
        />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest whitespace-nowrap">Date</span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              min={minDate}
              max={maxDate}
              onChange={e => { setStartDate(clampDate(e.target.value)); setActiveDatePreset(null); }}
              className="h-8 px-2.5 text-xs font-medium rounded-md border border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <span className="text-slate-500 dark:text-slate-400 text-sm select-none">–</span>
            <input
              type="date"
              value={endDate}
              min={minDate}
              max={maxDate}
              onChange={e => { setEndDate(clampDate(e.target.value)); setActiveDatePreset(null); }}
              className="h-8 px-2.5 text-xs font-medium rounded-md border border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 self-center" />
          <QuickDatePresets onSelect={applyPreset} activeKey={activeDatePreset} />
          <div className="flex-1" />
          <Button variant="primary" size="sm" onClick={() => fetchData(clampDate(startDate), clampDate(endDate))} disabled={state.loading}>
            {state.loading
              ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading…</>
              : <><RefreshCw className="w-3 h-3 mr-1" /> Apply</>}
          </Button>
        </div>

        {state.loading && <ReportLoading label="Income vs Expense" />}
        {state.error && <ReportError message={state.error} onRetry={() => fetchData(startDate, endDate)} />}
        {state.data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Received" value={formatCurrency(state.data.total_income)} icon={TrendingUp}
                colorClass="bg-green-50 dark:bg-green-950/30" iconColorClass="text-green-600 dark:text-green-400" />
              <StatCard label="Total Spent" value={formatCurrency(state.data.total_expense)} icon={TrendingDown}
                colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
              <StatCard
                label="Net Surplus / (Deficit)"
                value={`${state.data.net_balance >= 0 ? '+' : ''}${formatCurrency(state.data.net_balance)}`}
                icon={state.data.net_balance >= 0 ? TrendingUp : TrendingDown}
                colorClass={state.data.net_balance >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}
                iconColorClass={state.data.net_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              />
              <StatCard
                label="Expense Ratio"
                value={`${expRatio.toFixed(1)}%`}
                icon={Percent}
                colorClass={expRatio > 100 ? 'bg-red-50 dark:bg-red-950/30' : expRatio > 75 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}
                iconColorClass={expRatio > 100 ? 'text-red-600 dark:text-red-400' : expRatio > 75 ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Monthly Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactApexChart
                  type="bar"
                  height={240}
                  series={[
                    { name: 'Income',  data: chartData.map((d: any) => d.Income  ?? 0) },
                    { name: 'Expense', data: chartData.map((d: any) => d.Expense ?? 0) },
                  ]}
                  options={{
                    ...baseChartOptions,
                    colors: ['#10B981', '#EF4444'],
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
                    xaxis: { categories: chartData.map((d: any) => d.name), labels: { style: axisLabelStyle } },
                    yaxis: { labels: { formatter: (v: number) => currencyK(v), style: axisLabelStyle } },
                    tooltip: { y: { formatter: (v: number) => currencyTooltip(v) }, theme: 'light' },
                    legend: { position: 'top', fontSize: '12px' },
                    grid: baseGrid,
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expense</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthsDesc.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center py-8 text-slate-400" colSpan={4}>No data available</TableCell>
                      </TableRow>
                    ) : monthsDesc.map(m => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium whitespace-nowrap">{fmtPeriod(m.month)}</TableCell>
                        <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">{formatCurrency(m.income)}</TableCell>
                        <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">{formatCurrency(m.expense)}</TableCell>
                        <TableCell className={cn('text-right font-semibold tabular-nums', m.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                          {m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {monthsDesc.length > 1 && (
                    <tfoot>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-600">
                        <TableCell className="font-semibold text-slate-700 dark:text-slate-300">Total</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-green-700 dark:text-green-400">{formatCurrency(state.data.total_income)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-red-700 dark:text-red-400">{formatCurrency(state.data.total_expense)}</TableCell>
                        <TableCell className={cn('text-right font-semibold tabular-nums', state.data.net_balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
                          {state.data.net_balance >= 0 ? '+' : ''}{formatCurrency(state.data.net_balance)}
                        </TableCell>
                      </TableRow>
                    </tfoot>
                  )}
                </Table>
              </CardContent>
            </Card>

            {catSorted.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>% of Total</TableHead>
                        <TableHead className="text-right">Entries</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catSorted.map((c: ExpenseCategory, i: number) => {
                        const pct = catTotal > 0 ? (c.total_amount / catTotal) * 100 : 0;
                        return (
                          <TableRow key={c.category_code}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: c.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="font-medium">{c.category}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400 font-medium">
                              {formatCurrency(c.total_amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-red-400 dark:bg-red-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">{pct.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-slate-600 dark:text-slate-400">{c.total_entries}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
