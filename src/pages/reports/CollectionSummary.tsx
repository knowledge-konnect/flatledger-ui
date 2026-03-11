import { useState, useEffect, useCallback, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
          <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-b border-indigo-200 dark:border-indigo-800">
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
                colorClass="bg-blue-50 dark:bg-blue-950/30" iconColorClass="text-blue-600 dark:text-blue-400" />
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
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="Billed" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Collected" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="Outstanding"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
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
