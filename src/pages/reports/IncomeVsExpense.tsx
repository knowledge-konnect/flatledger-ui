import { useState, useEffect, useCallback, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { cn } from '../../lib/utils';
import { axisLabelStyle, baseChartOptions, baseGrid, currencyK, currencyTooltip } from '../../lib/chartOptions';
import reportsApi, { IncomeVsExpenseData } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickDatePresets, startOfMonth, today, formatCurrency, fmtPeriod, DatePresetKey,
} from './_shared';

export default function IncomeVsExpensePage() {
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [activeDatePreset, setActiveDatePreset] = useState<DatePresetKey | null>('thisMonth');
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
      fetchData(startOfMonth(), today());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (preset: DatePresetKey, sd: string, ed: string) => {
    setActiveDatePreset(preset);
    setStartDate(sd);
    setEndDate(ed);
    fetchData(sd, ed);
  };

  const monthsAsc = [...(state.data?.months ?? [])].sort((a, b) => a.month.localeCompare(b.month));
  const monthsDesc = [...monthsAsc].reverse();

  const chartData = monthsAsc.map(m => ({
    name: fmtPeriod(m.month),
    Income: m.income,
    Expense: m.expense,
    Net: m.net,
  }));

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
          <Button variant="primary" size="sm" onClick={() => fetchData(startDate, endDate)} disabled={state.loading}>
            {state.loading
              ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading…</>
              : <><RefreshCw className="w-3 h-3 mr-1" /> Apply</>}
          </Button>
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
                value={`${state.data.net_balance >= 0 ? '+' : ''}${formatCurrency(state.data.net_balance)}`}
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
                <ReactApexChart
                  type="bar"
                  height={240}
                  series={[
                    { name: 'Income', data: chartData.map((d: any) => d.Income ?? 0) },
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
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Net Balance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactApexChart
                  type="area"
                  height={200}
                  series={[{ name: 'Net', data: chartData.map((d: any) => d.Net ?? 0) }]}
                  options={{
                    ...baseChartOptions,
                    colors: ['#10B981'],
                    stroke: { width: 2.5, curve: 'smooth' },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 } },
                    annotations: { yaxis: [{ y: 0, borderColor: '#94A3B8', strokeDashArray: 4, label: { text: 'Break-even', style: { color: '#94A3B8', background: 'transparent' } } }] },
                    xaxis: { categories: chartData.map((d: any) => d.name), labels: { style: axisLabelStyle } },
                    yaxis: { labels: { formatter: (v: number) => currencyK(v), style: axisLabelStyle } },
                    tooltip: { y: { formatter: (v: number) => currencyTooltip(v) }, theme: 'light' },
                    legend: { show: false },
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
                        <TableCell className="text-center py-8 text-slate-400" colSpan={4}>
                          No data available
                        </TableCell>
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
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
