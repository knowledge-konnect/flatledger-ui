import { useState, useEffect, useCallback, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { PieChart as PieChartIcon, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import reportsApi, { ExpenseByCategoryData } from '../../api/reportsApi';
import { axisLabelStyle, baseChartOptions, baseGrid, currencyK, currencyTooltip } from '../../lib/chartOptions';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickDatePresets, startOfMonth, today, CHART_COLORS, formatCurrency, DatePresetKey, fmtDate,
} from './_shared';

export default function ExpenseByCategoryPage() {
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [activeDatePreset, setActiveDatePreset] = useState<DatePresetKey | null>('thisMonth');
  const [state, setState] = useState<ReportState<ExpenseByCategoryData>>(initialState());

  const fetchData = useCallback((sd: string, ed: string) => {
    setState({ loading: true, error: null, data: null });
    reportsApi.getExpenseByCategory(sd, ed)
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

  const sortedCategories = [...(state.data?.categories ?? [])].sort((a, b) => b.total_amount - a.total_amount);
  const pieData = sortedCategories.map(c => ({ name: c.category, value: c.total_amount }));

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Expenses by Category"
          description="Expense breakdown by spending category"
          icon={PieChartIcon}
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

        {state.loading && <ReportLoading label="Expense by Category" />}
        {state.error && <ReportError message={state.error} onRetry={() => fetchData(startDate, endDate)} />}
        {state.data && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard label="Total Expense" value={formatCurrency(state.data.total_expense)} icon={TrendingDown}
                colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
              <StatCard label="Categories" value={state.data.categories.length} icon={PieChartIcon}
                colorClass="bg-purple-50 dark:bg-purple-950/30" iconColorClass="text-purple-600 dark:text-purple-400" />
            </div>

            {pieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Spend by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-5">
                    <div className="w-full flex justify-center">
                      <ReactApexChart
                        type="donut"
                        width={220}
                        height={220}
                        series={pieData.map((d) => d.value)}
                        options={{
                          ...baseChartOptions,
                          labels: pieData.map((d) => d.name),
                          colors: CHART_COLORS,
                          legend: { show: false },
                          dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                          plotOptions: { pie: { donut: { size: '60%' } } },
                          tooltip: { y: { formatter: (v: number) => currencyTooltip(v) }, theme: 'light' },
                        }}
                      />
                    </div>
                    <div className="w-full max-w-xl flex flex-col gap-2">
                      {sortedCategories.map((c, i) => (
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

            {sortedCategories.length > 0 && (() => {
              const sorted = [...sortedCategories]
                .sort((a, b) => b.total_amount - a.total_amount)
                .map((c, i) => ({ name: c.category, Amount: c.total_amount, _i: i }));
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Category Ranking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReactApexChart
                      type="bar"
                      height={Math.max(120, sorted.length * 38)}
                      series={[{ name: 'Amount', data: sorted.map((s) => s.Amount) }]}
                      options={{
                        ...baseChartOptions,
                        colors: ['#10B981'],
                        plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
                        xaxis: {
                          categories: sorted.map((s) => s.name),
                          labels: { formatter: (v: string) => currencyK(Number(v)), style: axisLabelStyle },
                        },
                        yaxis: { labels: { style: axisLabelStyle } },
                        tooltip: { y: { formatter: (v: number) => currencyTooltip(v) }, theme: 'light' },
                        legend: { show: false },
                        grid: { ...baseGrid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
                        fill: { colors: sorted.map((s) => CHART_COLORS[s._i % CHART_COLORS.length]) },
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })()}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>% Share</TableHead>
                      <TableHead className="text-right">No. of Entries</TableHead>
                      <TableHead>First Expense</TableHead>
                      <TableHead>Last Expense</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCategories.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center py-8 text-slate-400" colSpan={7}>
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : sortedCategories.map((c, i) => {
                      const pct = state.data!.total_expense > 0
                        ? (c.total_amount / state.data!.total_expense) * 100
                        : 0;
                      return (
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
                          <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400 font-medium">
                            {formatCurrency(c.total_amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-red-400 dark:bg-red-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{pct.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.total_entries}</TableCell>
                          <TableCell className="text-slate-500 whitespace-nowrap">{c.first_expense_date ? fmtDate(c.first_expense_date) : '—'}</TableCell>
                          <TableCell className="text-slate-500 whitespace-nowrap">{c.last_expense_date ? fmtDate(c.last_expense_date) : '—'}</TableCell>
                        </TableRow>
                      );
                    })}
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
