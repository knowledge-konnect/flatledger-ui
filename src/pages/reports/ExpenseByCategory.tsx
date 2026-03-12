import { useState, useEffect, useCallback, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { PieChart as PieChartIcon, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import reportsApi, { ExpenseByCategoryData } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickDatePresets, DateInput, startOfYear, today, CHART_COLORS, formatCurrency,
} from './_shared';

export default function ExpenseByCategoryPage() {
  const [startDate, setStartDate] = useState(startOfYear());
  const [endDate, setEndDate] = useState(today());
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
      fetchData(startOfYear(), today());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sd: string, ed: string) => { setStartDate(sd); setEndDate(ed); fetchData(sd, ed); };

  const pieData = state.data?.categories.map(c => ({ name: c.category, value: c.total_amount })) ?? [];

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Expenses by Category"
          description="Expense breakdown by spending category"
          icon={PieChartIcon}
        />

        {/* Filter Block */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-rose-200 dark:border-rose-800 shadow-sm">
          <div className="px-4 py-2.5 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 border-b border-rose-200 dark:border-rose-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏷️</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Expenses by Category</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">• Spending by category</span>
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
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-shrink-0 w-[220px]">
                      <ReactApexChart
                        type="donut"
                        width={220}
                        height={220}
                        series={pieData.map((d) => d.value)}
                        options={{
                          chart: { background: 'transparent' },
                          labels: pieData.map((d) => d.name),
                          colors: CHART_COLORS,
                          legend: { show: false },
                          dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                          plotOptions: { pie: { donut: { size: '60%' } } },
                          tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {state.data.categories.map((c, i) => (
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

            {state.data.categories.length > 0 && (() => {
              const sorted = [...state.data.categories]
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
                        chart: { toolbar: { show: false }, background: 'transparent' },
                        colors: ['#10B981'],
                        plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
                        dataLabels: { enabled: false },
                        xaxis: {
                          categories: sorted.map((s) => s.name),
                          labels: { formatter: (v: string) => `₹${(Number(v) / 1000).toFixed(0)}k`, style: { fontSize: '11px' } },
                        },
                        yaxis: { labels: { style: { fontSize: '11px' } } },
                        tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                        legend: { show: false },
                        grid: { borderColor: '#E2E8F0', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
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
                      <TableHead>Total Amount</TableHead>
                      <TableHead>No. of Entries</TableHead>
                      <TableHead>First Expense</TableHead>
                      <TableHead>Last Expense</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.data.categories.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center py-8 text-slate-400" colSpan={6}>
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : state.data.categories.map((c, i) => (
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
        )}
      </div>
    </DashboardLayout>
  );
}
