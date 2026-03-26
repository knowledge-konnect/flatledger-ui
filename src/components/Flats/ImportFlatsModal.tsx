import { useState, useCallback } from 'react';
import { Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Modal, { ModalFooter } from '../ui/Modal';
import Button from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import { parseImportFile, downloadImportTemplate, ParsedFlatRow } from '../../lib/parseImportFile';
import { useBulkCreateFlats } from '../../hooks/useFlats';
import { BulkFlatFailure, FlatDto } from '../../api/flatsApi';
import { categorizeApiError } from '../../api/errorHandler';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';

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
// Helper: cell class based on whether that field has an error
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  flatNo: 'Flat No',
  ownerName: 'Owner Name',
  contactMobile: 'Mobile',
  contactEmail: 'Email',
  statusCode: 'Status',
};

const PREVIEW_FIELDS = ['flatNo', 'ownerName', 'contactMobile', 'contactEmail', 'statusCode'];

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

  const bulkCreate = useBulkCreateFlats();
  const { showToast } = useToast();

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  // -------------------------------------------------------------------------
  // Reset when modal closes
  // -------------------------------------------------------------------------
  const handleClose = () => {
    setStep('upload');
    setParsedRows([]);
    setParseError(null);
    setResults(null);
    setFatalError(null);
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
        setParseError('The file has no data rows. Please check the file and try again.');
        setIsParsing(false);
        return;
      }
      setParsedRows(rows);
      setStep('preview');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Step 2 → Step 3: submit valid rows to backend
  // -------------------------------------------------------------------------
  const handleImport = async () => {
    if (!validRows.length) return;

    const payload = { flats: validRows.map(r => r.data!) };
    try {
      const res = await bulkCreate.mutateAsync(payload);
      setFatalError(null);
      setResults({ succeeded: res.succeeded, failed: res.failed });
      setStep('results');

      if (res.failed.length === 0) {
        showToast(`${res.succeeded.length} flat(s) imported successfully`, 'success');
      } else {
        showToast(
          `${res.succeeded.length} imported, ${res.failed.length} failed`,
          res.succeeded.length > 0 ? 'info' : 'error'
        );
      }
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
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file with your flat data.
        Required columns: <span className="font-medium text-slate-700 dark:text-slate-300">Flat No, Owner Name, Mobile</span>. Maintenance amount is set automatically from society settings.
      </p>

      <button
        type="button"
        onClick={downloadImportTemplate}
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        <Download className="w-4 h-4" />
        Download Import Template (.xlsx)
      </button>

      <FileUpload
        accept=".csv,.xlsx,.xls"
        maxSize={5}
        onFilesSelected={handleFilesSelected}
      />

      {isParsing && (
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
          Parsing file…
        </p>
      )}

      {parseError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{parseError}</p>
        </div>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Summary banner */}
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
            {validRows.length} valid row(s)
          </span>
          {invalidRows.length > 0 && (
            <span className="ml-2 font-semibold text-amber-700 dark:text-amber-300">
              · {invalidRows.length} row(s) with errors (will be skipped)
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
        Rows with errors will be skipped. Fix the file and re-import to include them.
      </p>
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
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Import failed</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{fatalError}</p>
            </div>
          </div>
        )}

        {/* All rows rejected by server */}
        {allFailed && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <p className="font-semibold text-red-700 dark:text-red-400">
              All {results!.failed.length} flat(s) failed — nothing was imported
            </p>
          </div>
        )}

        {/* Success count */}
        {results && results.succeeded.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                {results.succeeded.length} flat(s) imported successfully
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
                {results.failed.length} flat(s) rejected by the server
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-red-200 dark:border-red-800">
              <table className="w-full text-xs">
                <thead className="bg-red-50 dark:bg-red-900/20">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-red-700 dark:text-red-400 w-24">Flat No</th>
                    <th className="px-3 py-2 text-left font-semibold text-red-700 dark:text-red-400">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {results.failed.map(f => {
                    // Backend may join multiple errors with "; " — split into separate lines
                    const reasons = f.error.split(/;\s*/).filter(Boolean);
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
                Fix the rejected rows in your file and re-import them separately.
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
    upload: 'Import Flats',
    preview: 'Preview Import',
    results: fatalError
      ? 'Import Failed'
      : results && results.succeeded.length === 0 && results.failed.length > 0
        ? 'Import Failed'
        : results && results.succeeded.length > 0 && results.failed.length > 0
          ? 'Partial Import'
          : 'Import Complete',
  };

  const renderFooter = () => {
    if (step === 'upload') {
      return (
        <ModalFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
        </ModalFooter>
      );
    }

    if (step === 'preview') {
      return (
        <ModalFooter>
          <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || bulkCreate.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {bulkCreate.isPending
              ? 'Importing…'
              : validRows.length === 0
                ? 'No valid rows'
                : `Import ${validRows.length} flat(s)`}
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={titles[step]}
      size="xl"
    >
      <div className="p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(['upload', 'preview', 'results'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                step === s
                  ? 'bg-emerald-600 text-white'
                  : (i < ['upload', 'preview', 'results'].indexOf(step))
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              )}>
                {i + 1}
              </div>
              <span className={cn(
                'text-xs font-medium capitalize',
                step === s ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
              )}>
                {s}
              </span>
              {i < 2 && <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />}
            </div>
          ))}
        </div>

        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'results' && renderResultsStep()}
      </div>
      {renderFooter()}
    </Modal>
  );
}
