import { useState, useEffect, useCallback, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { BarChart2, Loader2, RefreshCw, TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import reportsApi, { CollectionSummaryData } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickPeriodPresets, DateInput, startYearMonth, currentYearMonth, formatCurrency,
} from './_shared';

export default function CollectionSummaryPage() {
  const [startPeriod, setStartPeriod] = useState(startYearMonth());
  const [endPeriod, setEndPeriod] = useState(currentYearMonth());
  const [state, setState] = useState<ReportState<CollectionSummaryData>>(initialState());

  const fetchData = useCallback((sp: string, ep: string) => {
    setState({ loading: true, error: null, data: null });
    reportsApi.getCollectionSummary(sp, ep)
      .then(d => setState({ loading: false, error: null, data: d }))
      .catch(e => setState({ loading: false, error: e?.response?.data?.message || e?.message || 'Failed to load', data: null }));
  }, []);

  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchData(startPeriod, endPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (sp: string, ep: string) => { setStartPeriod(sp); setEndPeriod(ep); fetchData(sp, ep); };

  const chartData = state.data?.periods.map(p => ({
    name: p.period,
    Billed: p.total_billed,
    Collected: p.total_collected,
    Outstanding: p.total_outstanding,
  })) ?? [];

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Billing Summary"
          description="Period-wise billing, collections, and outstanding balances"
          icon={BarChart2}
        />

        {/* Filter Block */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
          <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Billing Summary</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">• Monthly billing &amp; collections</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex flex-wrap items-end gap-2">
              <DateInput label="Start Period" value={startPeriod} onChange={setStartPeriod} type="month" />
              <DateInput label="End Period" value={endPeriod} onChange={setEndPeriod} type="month" />
              <div className="flex-1 min-w-[200px]">
                <QuickPeriodPresets onSelect={applyPreset} />
              </div>
              <Button variant="primary" size="sm" onClick={() => fetchData(startPeriod, endPeriod)} disabled={state.loading} className="h-[34px]">
                {state.loading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Loading…</>
                  : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Apply</>}
              </Button>
            </div>
          </div>
        </div>

        {state.loading && <ReportLoading label="Collection Summary" />}
        {state.error && <ReportError message={state.error} onRetry={() => fetchData(startPeriod, endPeriod)} />}
        {state.data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Billed" value={formatCurrency(state.data.total_billed)} icon={Wallet}
                colorClass="bg-emerald-50 dark:bg-emerald-950/30" iconColorClass="text-emerald-600 dark:text-emerald-400" />
              <StatCard label="Total Collected" value={formatCurrency(state.data.total_collected)} icon={TrendingUp}
                colorClass="bg-green-50 dark:bg-green-950/30" iconColorClass="text-green-600 dark:text-green-400" />
              <StatCard label="Total Outstanding" value={formatCurrency(state.data.total_outstanding)} icon={TrendingDown}
                colorClass="bg-red-50 dark:bg-red-950/30" iconColorClass="text-red-600 dark:text-red-400" />
              <StatCard label="Total Flats" value={state.data.total_flats} icon={Users}
                colorClass="bg-purple-50 dark:bg-purple-950/30" iconColorClass="text-purple-600 dark:text-purple-400" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactApexChart
                  type="line"
                  height={260}
                  series={[
                    { name: 'Billed', type: 'column', data: chartData.map((d: any) => d.Billed ?? 0) },
                    { name: 'Collected', type: 'column', data: chartData.map((d: any) => d.Collected ?? 0) },
                    { name: 'Outstanding', type: 'line', data: chartData.map((d: any) => d.Outstanding ?? 0) },
                  ] as any}
                  options={{
                    chart: { toolbar: { show: false }, background: 'transparent' },
                    colors: ['#10B981', '#F59E0B', '#EF4444'],
                    stroke: { width: [0, 0, 2.5], curve: 'smooth' },
                    markers: { size: [0, 0, 4] },
                    dataLabels: { enabled: false },
                    xaxis: { categories: chartData.map((d: any) => d.name), labels: { style: { fontSize: '11px' } } },
                    yaxis: { labels: { formatter: (v: number) => `₹${(v / 1000).toFixed(0)}k`, style: { fontSize: '11px' } } },
                    legend: { position: 'top', fontSize: '12px' },
                    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
                    grid: { borderColor: '#E2E8F0' },
                  }}
                />
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
                    {state.data.periods.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center py-8 text-slate-400" colSpan={7}>
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : state.data.periods.map(p => (
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
        )}
      </div>
    </DashboardLayout>
  );
}
