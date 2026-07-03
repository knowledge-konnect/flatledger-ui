import { useState, useCallback, useMemo } from 'react';
import { Download, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet, AlertCircle } from 'lucide-react';
import Modal, { ModalFooter } from '../ui/Modal';
import Button from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import Tooltip from '../ui/Tooltip';
import { parseImportFile, downloadImportTemplate, ParsedFlatRow } from '../../lib/parseImportFile';
import { useBulkCreateFlats } from '../../hooks/useFlats';
import { BulkFlatFailure, FlatDto, CreateFlatDto } from '../../api/flatsApi';
import { categorizeApiError } from '../../api/errorHandler';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BULK_LIMIT = 100;
const MAX_UPLOAD_ROWS = 100;

const FIELD_LABELS: Record<string, string> = {
  flatNo: 'Flat No',
  ownerName: 'Owner Name',
  contactMobile: 'Mobile',
  contactEmail: 'Email',
  statusCode: 'Status',
};

const PREVIEW_FIELDS = ['flatNo', 'ownerName', 'contactMobile', 'contactEmail', 'statusCode'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportFlatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'results';

interface ImportResults {
  succeeded: FlatDto[];
  failed: BulkFlatFailure[];
}

// ---------------------------------------------------------------------------
// Helper: Parse backend error message into individual error lines
// ---------------------------------------------------------------------------

function parseErrorMessage(error: string): string[] {
  return error
    .split(/;\s*|,\s*|\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportFlatsModal({ isOpen, onClose, onSuccess }: ImportFlatsModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedFlatRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const skipBilling = false;

  const bulkCreate = useBulkCreateFlats();
  const { showToast } = useToast();

  const validRows = useMemo(() => parsedRows.filter(r => r.isValid), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter(r => !r.isValid), [parsedRows]);
  const isImporting = bulkCreate.isPending || !!batchProgress;

  // -------------------------------------------------------------------------
  // Helper: show result toast based on import outcome
  // -------------------------------------------------------------------------
  const showResultToast = (succeeded: number, failed: number) => {
    if (failed === 0) {
      showToast(`${succeeded} flat(s) imported successfully`, 'success');
    } else {
      showToast(
        `${succeeded} imported, ${failed} failed`,
        succeeded > 0 ? 'info' : 'error'
      );
    }
  };

  // -------------------------------------------------------------------------
  // Reset when modal closes
  // -------------------------------------------------------------------------
  const handleClose = () => {
    setStep('upload');
    setParsedRows([]);
    setParseError(null);
    setResults(null);
    setFatalError(null);
    setBatchProgress(null);
    onClose();
  };

  // -------------------------------------------------------------------------
  // Step 1 → Step 2: parse the file
  // -------------------------------------------------------------------------
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setParseError(null);
    setIsParsing(true);
    try {
      const rows = await parseImportFile(files[0]);
      if (rows.length === 0) {
        setParseError('📄 No flats found in your file. Make sure your file has data rows below the header. Download our template to see the correct format.');
        setIsParsing(false);
        return;
      }
      
      // Check max upload limit
      if (rows.length > MAX_UPLOAD_ROWS) {
        setParseError(
          `⚠️ Your file has ${rows.length} flats, but you can only import ${MAX_UPLOAD_ROWS} at a time. ` +
          `Please split the file into smaller batches (${MAX_UPLOAD_ROWS} or fewer rows each) and import them separately.`
        );
        setIsParsing(false);
        return;
      }
      
      setParsedRows(rows);
      setStep('preview');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '❌ We couldn\'t read your file. Make sure it\'s a valid .csv file.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Step 2 → Step 3: submit valid rows to backend (batched at 100)
  // -------------------------------------------------------------------------
  const handleImport = async () => {
    if (!validRows.length) return;
    await performImport();
  };

  const performImport = async () => {
    if (!validRows.length) return;

    // Safely extract valid flats with guard
    const flats: CreateFlatDto[] = [];
    for (const row of validRows) {
      if (row.isValid && row.data) {
        flats.push(row.data);
      }
    }

    if (flats.length === 0) {
      setFatalError('No valid flats to import');
      setStep('results');
      return;
    }

    // Hard limit guard
    if (flats.length > BULK_LIMIT) {
      // Chunk into batches of BULK_LIMIT and submit sequentially
      const batches: typeof flats[] = [];
      for (let i = 0; i < flats.length; i += BULK_LIMIT) {
        batches.push(flats.slice(i, i + BULK_LIMIT));
      }

      const allSucceeded: ImportResults['succeeded'] = [];
      const allFailed: ImportResults['failed'] = [];

      setBatchProgress({ current: 0, total: batches.length });

      for (let i = 0; i < batches.length; i++) {
        setBatchProgress({ current: i + 1, total: batches.length });
        try {
          const res = await bulkCreate.mutateAsync({ flats: batches[i], skipBilling });
          allSucceeded.push(...(res.succeeded ?? []));
          allFailed.push(...(res.failed ?? []));
        } catch (err) {
          const apiErr = categorizeApiError(err);
          setFatalError(apiErr.message);
          setResults({ succeeded: allSucceeded, failed: allFailed });
          setStep('results');
          setBatchProgress(null);
          showToast(`Batch ${i + 1} failed: ${apiErr.message}`, 'error');
          return;
        }
      }

      setBatchProgress(null);
      setFatalError(null);
      setResults({ succeeded: allSucceeded, failed: allFailed });
      setStep('results');
      showResultToast(allSucceeded.length, allFailed.length);
      return;
    }

    try {
      const res = await bulkCreate.mutateAsync({ flats, skipBilling });
      const succeeded = res.succeeded ?? [];
      const failed = res.failed ?? [];
      setFatalError(null);
      setResults({ succeeded, failed });
      setStep('results');
      showResultToast(succeeded.length, failed.length);
    } catch (err) {
      const apiErr = categorizeApiError(err);
      setFatalError(apiErr.message);
      setResults({ succeeded: [], failed: [] });
      setStep('results');
      showToast(apiErr.message, 'error');
    }
  };

  // -------------------------------------------------------------------------
  // Step 3: Done
  // -------------------------------------------------------------------------
  const handleDone = () => {
    if (results && results.succeeded.length > 0) {
      onSuccess();
    }
    handleClose();
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderUploadStep = () => (
    <div className="space-y-3">
      <FileUpload
        accept=".csv"
        maxSize={5}
        onFilesSelected={handleFilesSelected}
      />

      {isParsing && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-pulse" />
            <FileSpreadsheet className="relative w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reading your file…</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Validating entries</p>
          </div>
        </div>
      )}

      {parseError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{parseError}</p>
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------------------
  // Importing overlay — shown over the preview during API call
  // -------------------------------------------------------------------------
  const renderImportingOverlay = () => {
    const pct = batchProgress
      ? Math.round((batchProgress.current / batchProgress.total) * 100)
      : null;

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        {/* Large animated spinner */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 animate-spin" style={{ animationDuration: '3s' }} />
          
          {/* Middle rotating ring (opposite direction) */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-emerald-400 border-r-emerald-400 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          
          {/* Inner circle with percentage */}
          <div className="absolute inset-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {pct !== null ? `${pct}%` : ''}
            </span>
          </div>
        </div>

        {/* Label and status */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            ⬆️ Uploading flats…
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {batchProgress
              ? `Batch ${batchProgress.current} of ${batchProgress.total} · Processing ${validRows.length} flat(s) total`
              : `Adding ${validRows.length} flat${validRows.length !== 1 ? 's' : ''} to your society`
            }
          </p>
        </div>

        {/* Animated progress bar */}
        <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          {pct !== null ? (
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 rounded-full shadow-lg"
              style={{ width: `${pct}%` }}
            />
          ) : (
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 animate-[shimmer_1.4s_ease-in-out_infinite] w-1/3" />
          )}
        </div>

        {/* Helper text */}
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          ⏳ This may take a moment… please keep this window open
        </p>
      </div>
    );
  };

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Importing overlay replaces table while API call is in-flight */}
      {isImporting && renderImportingOverlay()}

      {/* Summary banner — hide while importing */}
      {!isImporting && <>{/* Summary banner */}
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        invalidRows.length > 0
          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
      )}>
        {invalidRows.length > 0
          ? <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          : <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        }
        <div className="text-sm">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            ✓ {validRows.length} flat(s) ready to import
          </span>
          {invalidRows.length > 0 && (
            <span className="ml-2 font-semibold text-amber-700 dark:text-amber-300">
              · ⚠️ {invalidRows.length} row(s) have errors (will be skipped)
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-80 rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400 w-8">#</th>
              {PREVIEW_FIELDS.map(f => (
                <th key={f} className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {FIELD_LABELS[f]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {parsedRows.map(row => (
              <tr
                key={row.rowIndex}
                className={cn(
                  row.isValid
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-red-50 dark:bg-red-900/10'
                )}
                aria-invalid={!row.isValid}
              >
                <td className="px-3 py-2 text-slate-400 font-mono">{row.rowIndex + 1}</td>
                {PREVIEW_FIELDS.map(field => {
                  const value = row.raw[field] ?? '';
                  const error = row.errors[field];
                  return (
                    <td
                      key={field}
                      className={cn(
                        'px-3 py-2 max-w-[140px] truncate',
                        error
                          ? 'text-red-700 dark:text-red-400 font-medium'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                      title={error ? `${value || '(empty)'} — ${error}` : value}
                    >
                      {value || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}
                      {error && (
                        <div className="text-red-500 dark:text-red-400 text-[10px] leading-tight mt-0.5 whitespace-normal">
                          {error}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        💡 Rows with errors will be skipped. Fix them in your file and import again.
      </p>
      </>}
    </div>
  );

  const renderResultsStep = () => {
    if (!results && !fatalError) return null;

    const allFailed = !fatalError && results !== null && results.succeeded.length === 0 && results.failed.length > 0;

    return (
      <div className="space-y-4">
        {/* Fatal / whole-request error (e.g. 400 empty list) */}
        {fatalError && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm">❌ Import Failed</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{fatalError}</p>
            </div>
          </div>
        )}

        {/* All rows rejected by server */}
        {allFailed && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <p className="font-semibold text-red-700 dark:text-red-400">
              ❌ All {results!.failed.length} flat(s) couldn't be added. Please check the errors below and try again.
            </p>
          </div>
        )}

        {/* Success count */}
        {results && results.succeeded.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                ✅ {results.succeeded.length} flat(s) added successfully
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                {results.succeeded.map(f => f.flatNo).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Failed rows table */}
        {results && results.failed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                ⚠️ {results.failed.length} flat(s) couldn't be added
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-red-200 dark:border-red-800">
              <table className="w-full text-xs">
                <thead className="bg-red-50 dark:bg-red-900/20">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-red-700 dark:text-red-400 w-24">Flat No</th>
                    <th className="px-3 py-2 text-left font-semibold text-red-700 dark:text-red-400">Why it failed</th>
                  </tr>
                </thead>
                <tbody>
                  {results.failed.map(f => {
                    const reasons = parseErrorMessage(f.error);
                    return (
                      <tr key={f.index} className="border-t border-red-100 dark:border-red-900">
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300 align-top">{f.flatNo}</td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400">
                          {reasons.length === 1
                            ? reasons[0]
                            : <ul className="list-disc list-inside space-y-0.5">{reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {results.succeeded.length > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                💡 Fix the errors above and import them again as a separate file.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Modal titles & footers per step
  // -------------------------------------------------------------------------

  const titles: Record<Step, string> = {
    upload: '📤 Import Flats',
    preview: '👀 Review & Confirm',
    results: fatalError
      ? '❌ Import Failed'
      : results && results.succeeded.length === 0 && results.failed.length > 0
        ? '❌ Some Flats Failed'
        : results && results.succeeded.length > 0 && results.failed.length > 0
          ? '⚠️ Partial Import'
          : '✅ Import Successful',
  };

  const renderFooter = () => {
    if (step === 'upload') {
      return (
        <ModalFooter>
          <div className="flex items-center gap-2 mr-auto">
            <Tooltip
              side="top"
              content={
                <div className="w-64 space-y-3 text-xs py-0.5">
                  {/* Required */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1.5">Required</p>
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-white">Flat No</span>
                        <span className="text-slate-400 text-right">unique number</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-white">Owner Name</span>
                        <span className="text-slate-400 text-right">full name</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-white">Mobile</span>
                        <span className="text-slate-400 text-right">10+ digits</span>
                      </div>
                    </div>
                  </div>
                  {/* Optional */}
                  <div className="border-t border-slate-700 pt-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Optional</p>
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-white">Email</span>
                        <span className="text-slate-400 text-right">owner's email</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-white">Status</span>
                        <span className="text-slate-400 text-right">defaults: Owner Occupied</span>
                      </div>
                    </div>
                  </div>
                  {/* Note */}
                  <div className="border-t border-slate-700 pt-2 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-px">💡</span>
                    <span className="text-slate-400">Maintenance amount auto-set from society settings</span>
                  </div>
                </div>
              }
            >
              <button type="button" className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <AlertCircle className="w-3.5 h-3.5" />
                File format
              </button>
            </Tooltip>
          </div>
          <button
            type="button"
            onClick={downloadImportTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download Template
          </button>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
        </ModalFooter>
      );
    }

    if (step === 'preview') {
      const isBatching = validRows.length > BULK_LIMIT;
      return (
        <ModalFooter>
          <Button variant="outline" onClick={() => setStep('upload')} disabled={!!batchProgress}>Back</Button>
          {batchProgress && (
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
              Batch {batchProgress.current} of {batchProgress.total}…
            </span>
          )}
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || bulkCreate.isPending || !!batchProgress}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {batchProgress
              ? `Importing batch ${batchProgress.current}/${batchProgress.total}…`
              : bulkCreate.isPending
                ? 'Uploading…'
                : validRows.length === 0
                  ? 'No flats to import'
                  : isBatching
                    ? `Import ${validRows.length} flats`
                    : `Import ${validRows.length} flat${validRows.length !== 1 ? 's' : ''}`}
          </Button>
        </ModalFooter>
      );
    }

    // Results step — show Try Again when everything failed, Done otherwise
    const canTryAgain = fatalError || (results !== null && results.succeeded.length === 0);
    return (
      <ModalFooter>
        {canTryAgain && (
          <Button variant="outline" onClick={() => { setStep('upload'); setParsedRows([]); setParseError(null); setResults(null); setFatalError(null); }}>
            Try Again
          </Button>
        )}
        <Button onClick={handleDone} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Done
        </Button>
      </ModalFooter>
    );
  };

  return (
    <>
      {/* Main Import Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={titles[step]}
        size="xl"
      >
        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-5">
            {(['upload', 'preview', 'results'] as Step[]).map((s, i) => {
              const stepIndex = ['upload', 'preview', 'results'].indexOf(step);
              const isDone = i < stepIndex;
              const isActive = step === s;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isDone
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  )}>
                    {isDone ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
                    <span className="capitalize">{s}</span>
                  </div>
                  {i < 2 && <div className="w-6 h-px bg-slate-200 dark:bg-slate-700" />}
                </div>
              );
            })}
          </div>

          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'results' && renderResultsStep()}
        </div>
        {renderFooter()}
      </Modal>
    </>
  );
}
