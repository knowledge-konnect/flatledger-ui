import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Search, X, TrendingDown, Users, IndianRupee, ChevronUp, ChevronDown, ChevronsUpDown, Download, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';
import reportsApi, { DefaulterEntry } from '../../api/reportsApi';
import {
  ReportState, initialState, ReportError, formatCurrency, fmtPeriod
} from './_shared';

function OverdueBadge({ months, total }: { months: number; total?: number }) {
  const label = total ? `${months} / ${total} mo` : `${months} mo`;
  if (months > 3) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        {label}
      </span>
    );
  }
  if (months >= 1) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
      {label}
    </span>
  );
}

export default function DefaultersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'flat_no' | 'total_outstanding' | 'pending_months'>('pending_months');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showPaid, setShowPaid] = useState(false);
  const [state, setState] = useState<ReportState<DefaulterEntry[]>>(initialState());

  const fetchData = useCallback(() => {
    setState({ loading: true, error: null, data: null });
    reportsApi.getDefaulters(0)
      .then(d => setState({ loading: false, error: null, data: d }))
      .catch(e => setState({ loading: false, error: e?.response?.data?.message || e?.message || 'Failed to load', data: null }));
  }, []);

  const didFetch = useRef(false);
  useEffect(() => {
    if (!didFetch.current) { didFetch.current = true; fetchData(); }
  }, [fetchData]);

  const allData = useMemo(() => [...(state.data ?? [])].sort((a, b) => {
    const diff = b.pending_months - a.pending_months;
    if (diff !== 0) return diff;
    return b.total_outstanding - a.total_outstanding;
  }), [state.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allData;
    return allData.filter(d =>
      d.flat_no?.toLowerCase().includes(q) ||
      d.owner_name?.toLowerCase().includes(q) ||
      d.contact_mobile?.toLowerCase().includes(q)
    );
  }, [allData, search]);

  const totalOutstanding = useMemo(() => allData.reduce((s, d) => s + d.total_outstanding, 0), [allData]);
  const highestEntry = allData[0];
  const avgOutstanding = allData.length > 0 ? totalOutstanding / allData.length : 0;
  const followUpFlats = useMemo(() => allData.slice(0, 3), [allData]);
  const followUpMessage = allData.length === 0
    ? 'No follow-up needed right now. Everything looks current.'
    : followUpFlats.length === 1
    ? `Focus on Flat ${followUpFlats[0].flat_no} first for the next payment follow-up.`
    : `Start with Flats ${followUpFlats.map((item) => item.flat_no).join(', ')} for the next reminder round.`;

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'flat_no') cmp = (a.flat_no ?? '').localeCompare(b.flat_no ?? '', undefined, { numeric: true });
    else if (sortField === 'total_outstanding') cmp = a.total_outstanding - b.total_outstanding;
    else cmp = a.pending_months - b.pending_months;
    return sortDir === 'asc' ? cmp : -cmp;
  }), [filtered, sortField, sortDir]);

  const exportCsv = () => {
    const rows: string[][] = [
      ['Flat', 'Owner', 'Phone', 'Outstanding', 'Paid', 'Overdue Months', 'Total Months', 'Due Period'],
      ...filtered.map(d => [
        d.flat_no ?? '',
        d.owner_name ?? '',
        d.contact_mobile ?? '',
        String(d.total_outstanding),
        String(d.total_paid),
        String(d.pending_months),
        String(d.total_months ?? ''),
        d.oldest_due_period ? fmtPeriod(d.oldest_due_period) : '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'defaulters.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const paginatedData = sorted.slice(page * pageSize, page * pageSize + pageSize);

  // const { user } = useAuth();

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Outstanding Dues"
          description="Flats with pending maintenance payments, sorted by overdue months"
          icon={AlertTriangle}
        />

        {state.error && <ReportError message={state.error} onRetry={fetchData} />}

        {/* ── KPI Summary Cards ─────────────────────────────────── */}
        {state.data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-red-100 dark:border-red-900/40 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-red-500 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Total Defaulters</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{allData.length}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">flats with pending dues</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-orange-100 dark:border-orange-900/40 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-tight">{formatCurrency(totalOutstanding)}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">avg {formatCurrency(avgOutstanding)} / flat</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-900/40 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Highest Due</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {highestEntry ? formatCurrency(highestEntry.total_outstanding) : '—'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {highestEntry ? `Flat ${highestEntry.flat_no}` : 'No data'}
                </p>
              </div>
            </div>
          </div>
        )}

        {state.data && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Suggested follow-up</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{followUpMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/maintenance')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-300"
              >
                Record payment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Table Card ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

          {/* Table toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-red-50/70 via-white to-amber-50/70 dark:from-red-950/20 dark:via-slate-900 dark:to-amber-950/10 flex flex-col gap-2.5 md:flex-row md:items-center">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {state.data
                  ? search.trim()
                    ? `${filtered.length} of ${allData.length} result${allData.length !== 1 ? 's' : ''}`
                    : `${allData.length} flat${allData.length !== 1 ? 's' : ''} with outstanding dues`
                  : 'Outstanding Dues'}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-300 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Severe 4+ mo
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Moderate 1–3 mo
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              <button
                type="button"
                onClick={() => setShowPaid(v => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap',
                  showPaid
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                )}
              >
                {showPaid ? 'Hide Paid' : 'Show Paid'}
              </button>
              {state.data && filtered.length > 0 && (
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              )}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search flat, owner, mobile…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); setPage(0); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {state.loading ? (
            <div className="py-20"><LoadingSpinner centered /></div>
          ) : !state.data ? null : allData.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={AlertTriangle}
                title="No outstanding dues"
                description="All flats are up to date with their maintenance payments"
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={Search}
                title="No results found"
                description={`No flats match "${search}"`}
              >
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  <X className="w-3.5 h-3.5" /> Clear search
                </button>
              </EmptyState>
            </div>
          ) : (
            <>
<div className="overflow-x-auto max-h-[68vh]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-red-50/95 dark:bg-red-950/55 backdrop-blur border-b border-red-200 dark:border-red-800">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-[0.08em] whitespace-nowrap w-24">
                        <button type="button" onClick={() => { if (sortField === 'flat_no') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField('flat_no'); setSortDir('asc'); } }} className="inline-flex items-center gap-1 hover:text-red-900 dark:hover:text-red-100 transition-colors">
                          Flat {sortField === 'flat_no' ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
                        </button>
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-[0.08em] max-w-[180px] w-[180px]">
                        Owner
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-[0.08em] whitespace-nowrap w-36 hidden lg:table-cell">
                        Phone
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-[0.08em] whitespace-nowrap w-36">
                        <button type="button" onClick={() => { if (sortField === 'total_outstanding') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField('total_outstanding'); setSortDir('desc'); } }} className="inline-flex items-center gap-1 ml-auto hover:text-red-900 dark:hover:text-red-100 transition-colors">
                          Outstanding {sortField === 'total_outstanding' ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
                        </button>
                      </th>
                      <th className={cn('px-5 py-3 text-right text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-[0.08em] whitespace-nowrap w-32', showPaid ? 'sm:table-cell' : 'hidden')}>
                        Paid
                      </th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-[0.08em] whitespace-nowrap">
                        <button type="button" onClick={() => { if (sortField === 'pending_months') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField('pending_months'); setSortDir('desc'); } }} className="inline-flex items-center gap-1 hover:text-red-900 dark:hover:text-red-100 transition-colors">
                          Overdue / Total {sortField === 'pending_months' ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
                        </button>
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-[0.08em] whitespace-nowrap hidden md:table-cell">
                        Due Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/70">
                    {paginatedData.map((d, i) => {
                      const isWorst = d.pending_months > 3;
                      const isWarn  = d.pending_months >= 1 && d.pending_months <= 3;
                      const period =
                        d.oldest_due_period && d.latest_due_period && d.oldest_due_period !== d.latest_due_period
                          ? `${fmtPeriod(d.oldest_due_period)} → ${fmtPeriod(d.latest_due_period)}`
                          : d.oldest_due_period
                          ? fmtPeriod(d.oldest_due_period)
                          : '—';
                      return (
                        <tr
                          key={d.flat_no ?? `row-${i}`}
                          className={cn(
                            'group transition-colors',
                            isWorst
                              ? 'bg-red-50/55 dark:bg-red-950/15 hover:bg-red-100/65 dark:hover:bg-red-950/25'
                              : isWarn
                              ? 'bg-amber-50/35 dark:bg-amber-950/10 hover:bg-amber-100/45 dark:hover:bg-amber-950/20'
                              : 'odd:bg-white even:bg-slate-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                          )}
                        >
                          {/* Flat No */}
                          <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                            <div className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-200/60 dark:border-red-800/60">
                              <span className="text-sm font-bold text-red-700 dark:text-red-400">{d.flat_no}</span>
                            </div>
                          </td>
                          {/* Owner */}
                          <td className="px-5 py-3 align-middle max-w-[180px]">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate block" title={d.owner_name || '—'}>
                              {d.owner_name || '—'}
                            </span>
                          </td>
                          {/* Phone */}
                          <td className="px-5 py-3 align-middle whitespace-nowrap hidden lg:table-cell">
                            {d.contact_mobile
                              ? (
                                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium tabular-nums">{d.contact_mobile}</span>
                              )
                              : <span className="text-xs text-slate-400">—</span>
                            }
                          </td>
                          {/* Outstanding */}
                          <td className="px-5 py-3.5 text-right align-middle whitespace-nowrap">
                            <span className="text-sm tabular-nums text-red-600 dark:text-red-400 font-semibold tracking-tight">
                              {formatCurrency(d.total_outstanding)}
                            </span>
                          </td>
                          {/* Paid */}
                          <td className={cn('px-5 py-3.5 text-right align-middle whitespace-nowrap', showPaid ? 'sm:table-cell' : 'hidden')}>
                            <span className="text-sm tabular-nums text-emerald-600 dark:text-emerald-400 font-medium tracking-tight">
                              {formatCurrency(d.total_paid)}
                            </span>
                          </td>
                          {/* Overdue badge */}
                          <td className="px-5 py-3.5 text-center align-middle whitespace-nowrap">
                            <OverdueBadge months={d.pending_months} total={d.total_months} />
                          </td>
                          {/* Due period range */}
                          <td className="px-5 py-3.5 align-middle whitespace-nowrap hidden md:table-cell">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{period}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length > pageSize && (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={filtered.length}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
                  />
                </div>
              )}


            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
