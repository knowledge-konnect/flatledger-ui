import { useState } from 'react';
import { FileDown, Loader2, Calendar, CalendarDays } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardContent } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import reportsApi from '../../api/reportsApi';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthProvider';

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const MAX_MONTH_VALUE = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}`;

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const SELECT_CLS = cn(
  'w-full h-9 px-3 text-sm rounded-md border appearance-none',
  'border-slate-300 dark:border-slate-600',
  'bg-white dark:bg-slate-800',
  'text-slate-900 dark:text-slate-100',
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
  'transition-colors'
);

const MONTHLY_TAGS = ['Collections', 'Expenses', 'Opening Balance', 'Closing Balance'];
const YEARLY_TAGS  = ['Monthly Breakdown', 'Collections', 'Expenses', 'Net Balance'];

type TabKey = 'monthly' | 'yearly';

export default function DownloadReportsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('monthly');

  const [monthValue, setMonthValue] = useState(MAX_MONTH_VALUE);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [yearType, setYearType] = useState<'financial' | 'calendar'>('calendar');
  const [isYearlyLoading, setIsYearlyLoading] = useState(false);

  const { user } = useAuth();
  const societyNameSafe = (user?.societyName || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 50);

  const handleMonthlyDownload = async () => {
    const [yearStr, monthStr] = monthValue.split('-');
    const yr = parseInt(yearStr, 10);
    const mo = parseInt(monthStr, 10);
    const prefix = societyNameSafe ? `${societyNameSafe}_` : '';
    const monthlyFilename = `${prefix}Monthly_Report_${MONTH_NAMES[mo - 1]}_${yr}.xlsx`;
    setIsMonthlyLoading(true);
    try {
      await reportsApi.downloadMonthlyReport(yr, mo, monthlyFilename);
      showToast('Monthly report download started', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to download monthly report', 'error');
    } finally {
      setIsMonthlyLoading(false);
    }
  };

  const handleYearlyDownload = async () => {
    const prefix = societyNameSafe ? `${societyNameSafe}_` : '';
    const yearlyTypeLabel = yearType === 'financial'
      ? `FY_${selectedYear - 1}-${String(selectedYear).slice(2)}`
      : `CY_${selectedYear}`;
    const yearlyFilename = `${prefix}Yearly_Report_${yearlyTypeLabel}.xlsx`;
    setIsYearlyLoading(true);
    try {
      await reportsApi.downloadYearlyReport(selectedYear, yearType, yearlyFilename);
      showToast('Yearly report download started', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to download yearly report', 'error');
    } finally {
      setIsYearlyLoading(false);
    }
  };

  // Helpers for month shortcuts
  

  const [selYearStr, selMonthStr] = monthValue ? monthValue.split('-') : ['', ''];
  const selectedMonthLabel = selMonthStr
    ? `${MONTH_NAMES[parseInt(selMonthStr, 10) - 1]} ${selYearStr}`
    : '';

  const yearRangeLabel = yearType === 'financial'
    ? `April ${selectedYear - 1} – March ${selectedYear}`
    : `January ${selectedYear} – December ${selectedYear}`;

  // Tag tooltips
  const MONTHLY_TAG_TOOLTIPS: Record<string, string> = {
    Collections: 'Total collections recorded for the selected month',
    Expenses: 'Total expenses recorded for the selected month',
    'Opening Balance': 'Opening balance at the start of month',
    'Closing Balance': 'Closing balance at the end of month',
  };

  const YEARLY_TAG_TOOLTIPS: Record<string, string> = {
    'Monthly Breakdown': 'Breakdown of figures per month for the year',
    Collections: 'Total collections for the year',
    Expenses: 'Total expenses for the year',
    'Net Balance': 'Net balance across the year',
  };

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        <PageHeader
          title="Download Reports"
          description="Export financial summaries as an Excel (.xlsx) file"
          icon={FileDown}
        />

        <div className="flex flex-col items-center gap-5 w-full">

        <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200">
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            aria-pressed={activeTab === 'monthly'}
            title="Monthly reports"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 transform scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            <Calendar className="w-4 h-4" />
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            aria-pressed={activeTab === 'yearly'}
            title="Yearly reports"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'yearly'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-slate-700 transform scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Yearly
          </button>
        </div>

        {activeTab === 'monthly' && (
          <Card className={cn('overflow-hidden w-full max-w-xl transition-all duration-200 hover:shadow-md', isMonthlyLoading ? 'opacity-60 pointer-events-none' : '')}>
            <div className="h-1 w-full bg-blue-400" />
            <CardContent className="pt-5">
              <div className="flex flex-col">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {MONTHLY_TAGS.map(tag => (
                    <span key={tag} title={MONTHLY_TAG_TOOLTIPS[tag]} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">Download a detailed monthly financial report</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={monthValue}
                    max={MAX_MONTH_VALUE}
                    aria-label="Select month"
                    onChange={e => setMonthValue(e.target.value)}
                    className={cn(
                      'w-full h-9 px-3 text-sm rounded-md border',
                      'border-slate-300 dark:border-slate-600',
                      'bg-white dark:bg-slate-800',
                      'text-slate-900 dark:text-slate-100',
                      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                      'transition-colors'
                    )}
                  />
                  {selectedMonthLabel && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      {selectedMonthLabel}
                    </p>
                  )}

                  
                </div>

                <Button
                  variant="primary"
                  className="w-full h-10 shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={handleMonthlyDownload}
                  disabled={isMonthlyLoading || !monthValue}
                >
                  {isMonthlyLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Downloading</>
                  ) : (
                    <><FileDown className="w-4 h-4 mr-2" /> Download Report (.xlsx)</>
                  )}
                </Button>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Exports as Excel (.xlsx). May take a few seconds depending on data size.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'yearly' && (
          <Card className={cn('overflow-hidden w-full max-w-xl transition-all duration-200 hover:shadow-md', isYearlyLoading ? 'opacity-60 pointer-events-none' : '')}>
            <div className="h-1 w-full bg-violet-400" />
            <CardContent className="pt-5">
              <div className="flex flex-col">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {YEARLY_TAGS.map(tag => (
                    <span key={tag} title={YEARLY_TAG_TOOLTIPS[tag]} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-100 dark:border-violet-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">Includes full year summary and breakdown</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Year</label>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value, 10))} className={SELECT_CLS}>
                      {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Year Type</label>
                    <select value={yearType} onChange={e => setYearType(e.target.value as 'financial' | 'calendar')} className={SELECT_CLS}>
                      <option value="financial">Financial Year</option>
                      <option value="calendar">Calendar Year</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800">
                  <CalendarDays className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{yearType === 'financial' ? `FY ${selectedYear - 1}–${String(selectedYear).slice(2)}` : `CY ${selectedYear}`}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{yearRangeLabel}</span>
                </div>

                <Button
                  variant="primary"
                  className="w-full h-10 shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={handleYearlyDownload}
                  disabled={isYearlyLoading}
                >
                  {isYearlyLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Downloading</>
                  ) : (
                    <><FileDown className="w-4 h-4 mr-2" /> Download Report (.xlsx)</>
                  )}
                </Button>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Exports as Excel (.xlsx). May take a few seconds depending on data size.</p>
              </div>
            </CardContent>
          </Card>
        )}

        </div>
      </div>
    </DashboardLayout>
  );
}
