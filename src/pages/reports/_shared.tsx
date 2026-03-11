import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/* ─────────────────── Date helpers ─────────────────── */

export const today = () => new Date().toISOString().split('T')[0];
export const startOfYear = () => new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
export const currentYearMonth = () => new Date().toISOString().slice(0, 7);
export const startYearMonth = () => `${new Date().getFullYear()}-01`;

export const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const fmtDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return `${String(d.getDate()).padStart(2,'0')} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return dateStr; }
};

export const fmtPeriod = (periodStr: string): string => {
  try {
    const d = new Date(periodStr + '-01T00:00:00');
    return `${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return periodStr; }
};

export function presetDate(preset: 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear'): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const tod = now.toISOString().split('T')[0];
  if (preset === 'thisMonth') {
    return { start: new Date(y, m, 1).toISOString().split('T')[0], end: tod };
  }
  if (preset === 'lastMonth') {
    const s = new Date(y, m - 1, 1);
    const e = new Date(y, m, 0);
    return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
  }
  if (preset === 'last3Months') {
    return { start: new Date(y, m - 2, 1).toISOString().split('T')[0], end: tod };
  }
  return { start: new Date(y, 0, 1).toISOString().split('T')[0], end: tod };
}

export function presetPeriod(preset: 'thisMonth' | 'thisQuarter' | 'thisYear'): { startPeriod: string; endPeriod: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const cur = now.toISOString().slice(0, 7);
  if (preset === 'thisMonth') {
    return { startPeriod: cur, endPeriod: cur };
  }
  if (preset === 'thisQuarter') {
    const qStart = Math.floor(m / 3) * 3;
    const sp = `${y}-${String(qStart + 1).padStart(2, '0')}`;
    return { startPeriod: sp, endPeriod: cur };
  }
  return { startPeriod: `${y}-01`, endPeriod: cur };
}

/* ─────────────────── Types ─────────────────── */

export interface ReportState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

export function initialState<T>(): ReportState<T> {
  return { loading: false, error: null, data: null };
}

export const CHART_COLORS = [
  '#6366F1', '#22C55E', '#F59E0B', '#EF4444',
  '#14B8A6', '#8B5CF6', '#EC4899', '#F97316',
];

/* ─────────────────── UI Components ─────────────────── */

export function ReportLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-sm">Loading {label}…</p>
    </div>
  );
}

export function ReportError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
      <AlertCircle className="w-8 h-8" />
      <p className="text-sm font-medium">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
      </Button>
    </div>
  );
}

export function StatCard({
  label, value, icon: Icon,
  colorClass = 'bg-indigo-50 dark:bg-indigo-950/30',
  iconColorClass = 'text-indigo-600 dark:text-indigo-400',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass?: string;
  iconColorClass?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-3.5">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
            <Icon className={cn('w-4 h-4', iconColorClass)} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 truncate uppercase tracking-wide">{label}</p>
            <p className="text-base font-bold text-slate-900 dark:text-white truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PRESET_DATE_LABELS = [
  { key: 'thisMonth',   label: 'This Month' },
  { key: 'lastMonth',   label: 'Last Month' },
  { key: 'last3Months', label: 'Last 3 Months' },
  { key: 'thisYear',    label: 'This Year' },
] as const;

const PRESET_PERIOD_LABELS = [
  { key: 'thisMonth',   label: 'This Month' },
  { key: 'thisQuarter', label: 'This Quarter' },
  { key: 'thisYear',    label: 'This Year' },
] as const;

export function QuickDatePresets({ onSelect }: { onSelect: (start: string, end: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mr-0.5">Quick:</span>
      {PRESET_DATE_LABELS.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => { const r = presetDate(p.key); onSelect(r.start, r.end); }}
          className="px-2 py-0.5 text-[11px] rounded-full border border-slate-300 dark:border-slate-600
                     text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:border-indigo-300
                     hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-700
                     dark:hover:text-indigo-400 transition-colors"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function QuickPeriodPresets({ onSelect }: { onSelect: (startPeriod: string, endPeriod: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mr-0.5">Quick:</span>
      {PRESET_PERIOD_LABELS.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => { const r = presetPeriod(p.key); onSelect(r.startPeriod, r.endPeriod); }}
          className="px-2 py-0.5 text-[11px] rounded-full border border-slate-300 dark:border-slate-600
                     text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:border-indigo-300
                     hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-700
                     dark:hover:text-indigo-400 transition-colors"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function DateInput({
  label, value, onChange, type = 'date',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'date' | 'month';
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600
                   bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                   focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                   h-[34px]"
      />
    </div>
  );
}

export function NumberInput({
  label, value, onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600
                   bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                   focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-36
                   h-[34px]"
      />
    </div>
  );
}

// Re-export formatCurrency so pages only need one import
export { formatCurrency };
