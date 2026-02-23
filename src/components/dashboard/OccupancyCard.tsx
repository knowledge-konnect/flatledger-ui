import { Building2 } from 'lucide-react';
import Card from '../ui/Card';
import { FlatDto } from '../../api/flatsApi';

interface OccupancyCardProps {
  flats: FlatDto[];
  loading?: boolean;
}

interface StatusGroup {
  label: string;
  count: number;
  dot: string;
  text: string;
}

function getOccupancyGroups(flats: FlatDto[]): StatusGroup[] {
  const counts: Record<string, number> = { occupied: 0, rented: 0, vacant: 0 };

  for (const flat of flats) {
    const code = (flat as any).statusCode?.toLowerCase() ?? flat.statusName?.toLowerCase() ?? '';
    if (code.includes('vacant')) counts.vacant++;
    else if (code.includes('rent') || code.includes('tenant')) counts.rented++;
    else counts.occupied++;
  }

  return [
    { label: 'Owner Occupied', count: counts.occupied, dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Rented Out',     count: counts.rented,   dot: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Vacant',         count: counts.vacant,   dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
  ];
}

export function OccupancyCard({ flats, loading = false }: OccupancyCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-2.5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-6 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const groups = getOccupancyGroups(flats);
  const total = flats.length;
  const vacantCount = groups.find(g => g.label === 'Vacant')?.count ?? 0;
  const accentColor = vacantCount > 0 ? 'border-l-amber-500' : 'border-l-emerald-500';
  const iconBg = vacantCount > 0 ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20';
  const iconColor = vacantCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';

  return (
    <Card
      className={`
        relative overflow-hidden rounded-xl border-l-4 ${accentColor}
        shadow-sm hover:shadow-lg hover:-translate-y-0.5
        transition-all duration-200 cursor-default select-none
        p-5 h-full flex flex-col
      `}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Flat Occupancy
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {total}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1.5">total flats</span>
          </p>
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Building2 className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="flex-1 flex flex-col justify-center space-y-3">
        {groups.map((g) => (
          <div key={g.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${g.dot}`} />
              {g.label}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold tabular-nums ${g.text}`}>{g.count}</span>
              {total > 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 w-8 text-right tabular-nums">
                  {((g.count / total) * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mini stacked bar */}
      {total > 0 && (
        <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          {groups.map((g, i) => (
            g.count > 0 && (
              <div
                key={i}
                className={`h-full ${g.dot} transition-all duration-700`}
                style={{ width: `${(g.count / total) * 100}%` }}
              />
            )
          ))}
        </div>
      )}
    </Card>
  );
}
