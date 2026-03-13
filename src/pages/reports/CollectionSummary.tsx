import { useState, useEffect, useCallback, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { BarChart2, Loader2, RefreshCw, TrendingUp, TrendingDown, Wallet, Users, Percent } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import reportsApi, { CollectionSummaryData } from '../../api/reportsApi';
import { cn } from '../../lib/utils';
import { axisLabelStyle, baseChartOptions, baseGrid, currencyK, currencyTooltip } from '../../lib/chartOptions';
import {
  ReportState, initialState, ReportLoading, ReportError, StatCard,
  QuickPeriodPresets, DateInput, currentYearMonth, formatCurrency, fmtPeriod, PeriodPresetKey,
} from './_shared';

export default function CollectionSummaryPage() {
  const [startPeriod, setStartPeriod] = useState(currentYearMonth());
  const [endPeriod, setEndPeriod] = useState(currentYearMonth());
  const [activePeriodPreset, setActivePeriodPreset] = useState<PeriodPresetKey | null>('thisMonth');
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

  const applyPreset = (preset: PeriodPresetKey, sp: string, ep: string) => {
    setActivePeriodPreset(preset);
    setStartPeriod(sp);
    setEndPeriod(ep);
    fetchData(sp, ep);
  };

  const periodsAsc = [...(state.data?.periods ?? [])].sort((a, b) => a.period.localeCompare(b.period));
  const periodsDesc = [...periodsAsc].reverse();

  const chartData = periodsAsc.map(p => ({
    name: fmtPeriod(p.period),
    Billed: p.total_billed,
    Collected: p.total_collected,
    Outstanding: p.total_outstanding,
  }));

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Billing Summary"
          description="Period-wise billing, collections, and outstanding balances"
          icon={BarChart2}
        />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest whitespace-nowrap">Period</span>
          <div className="flex items-center gap-1.5">
            <input
              type="month"
              value={startPeriod}
              onChange={e => { setStartPeriod(e.target.value); setActivePeriodPreset(null); }}
              className="h-8 px-2.5 text-xs font-medium rounded-md border border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <span className="text-slate-500 dark:text-slate-400 text-sm select-none">–</span>
            <input
              type="month"
              value={endPeriod}
              onChange={e => { setEndPeriod(e.target.value); setActivePeriodPreset(null); }}
              className="h-8 px-2.5 text-xs font-medium rounded-md border border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 self-center" />
          <QuickPeriodPresets onSelect={applyPreset} activeKey={activePeriodPreset} />
          <div className="flex-1" />
          <Button variant="primary" size="sm" onClick={() => fetchData(startPeriod, endPeriod)} disabled={state.loading}>
            {state.loading
              ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading…</>
              : <><RefreshCw className="w-3 h-3 mr-1" /> Apply</>}
          </Button>
        </div>

        {state.loading && <ReportLoading label="Collection Summary" />}
        {state.error && <ReportError message={state.error} onRetry={() => fetchData(startPeriod, endPeriod)} />}
        {state.data && (
          <div className="space-y-3">
            {/* Summary KPI cards — 5 cards across */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard label="Total Billed" value={formatCurrency(state.data.total_billed)} icon={Wallet}
                colorClass="bg-emerald-100 dark:bg-emerald-900/40" iconColorClass="text-emerald-700 dark:text-emerald-400" />
              <StatCard label="Total Collected" value={formatCurrency(state.data.total_collected)} icon={TrendingUp}
                colorClass="bg-green-100 dark:bg-green-900/40" iconColorClass="text-green-700 dark:text-green-400" />
              <StatCard label="Total Outstanding" value={formatCurrency(state.data.total_outstanding)} icon={TrendingDown}
                colorClass="bg-red-100 dark:bg-red-900/40" iconColorClass="text-red-700 dark:text-red-400" />
              {(() => {
                const collRate = state.data.collection_percentage
                  ?? (state.data.total_billed > 0 ? (state.data.total_collected / state.data.total_billed) * 100 : 0);
                return (
                  <StatCard
                    label="Collection Rate"
                    value={`${collRate.toFixed(1)}%`}
                    icon={Percent}
                    colorClass={
                      collRate >= 80 ? 'bg-green-100 dark:bg-green-900/40'
                        : collRate >= 50 ? 'bg-amber-100 dark:bg-amber-900/40'
                        : 'bg-red-100 dark:bg-red-900/40'
                    }
                    iconColorClass={
                      collRate >= 80 ? 'text-green-700 dark:text-green-400'
                        : collRate >= 50 ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-700 dark:text-red-400'
                    }
                  />
                );
              })()}
              <StatCard label="Flats Billed" value={state.data.total_flats} icon={Users}
                colorClass="bg-purple-100 dark:bg-purple-900/40" iconColorClass="text-purple-700 dark:text-purple-400" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-visible">
                <ReactApexChart
                  type="line"
                  height={260}
                  series={[
                    { name: 'Billed', type: 'column', data: chartData.map((d: any) => d.Billed ?? 0) },
                    { name: 'Collected', type: 'column', data: chartData.map((d: any) => d.Collected ?? 0) },
                    { name: 'Outstanding', type: 'line', data: chartData.map((d: any) => d.Outstanding ?? 0) },
                  ] as any}
                  options={{
                    ...baseChartOptions,
                    chart: {
                      ...(baseChartOptions as any).chart,
                      parentHeightOffset: 0,
                      offsetX: 0,
                    },
                    colors: ['#3B82F6', '#10B981', '#EF4444'],
                    stroke: { width: [0, 0, 2.5], curve: 'smooth' },
                    markers: { size: [0, 0, 4] },
                    xaxis: { categories: chartData.map((d: any) => d.name), labels: { style: axisLabelStyle } },
                    yaxis: { labels: { formatter: (v: number) => currencyK(v), style: axisLabelStyle } },
                    legend: { position: 'top', fontSize: '12px' },
                    tooltip: {
                      y: { formatter: (v: number) => currencyTooltip(v) },
                      theme: 'light',
                      followCursor: true,
                    },
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
                    grid: baseGrid,
                  }}
                />
                </div>
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
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Collection %</TableHead>
                      <TableHead className="text-right">Paid Flats</TableHead>
                      <TableHead className="text-right">Partial</TableHead>
                      <TableHead className="text-right">Unpaid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodsDesc.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center py-8 text-slate-400" colSpan={8}>
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : periodsDesc.map(p => {
                      const rate = p.total_billed > 0 ? (p.total_collected / p.total_billed) * 100 : 0;
                      return (
                        <TableRow key={p.period}>
                          <TableCell className="font-medium whitespace-nowrap">{fmtPeriod(p.period)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(p.total_billed)}</TableCell>
                          <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">{formatCurrency(p.total_collected)}</TableCell>
                          <TableCell className={cn('text-right tabular-nums', p.total_outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500')}>
                            {formatCurrency(p.total_outstanding)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                              rate >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                : rate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            )}>
                              {rate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{p.flats_paid}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.flats_partial}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.flats_unpaid}</TableCell>
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
