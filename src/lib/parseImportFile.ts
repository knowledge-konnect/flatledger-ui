import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { CreateFlatDto } from '../api/flatsApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedFlatRow {
  /** 0-based row index in the uploaded file (excluding header) */
  rowIndex: number;
  /** Raw values from the file */
  raw: Record<string, string>;
  /** Parsed and coerced payload ready for API, present only when valid */
  data?: CreateFlatDto;
  /** Per-field validation errors */
  errors: Record<string, string>;
  /** True when all required fields are valid */
  isValid: boolean;
}

// ---------------------------------------------------------------------------
// Zod schema for a single import row
// ---------------------------------------------------------------------------

const VALID_STATUS_CODES = ['Owner occupied', 'vacant', 'rented', 'under_maintenance'] as const;

const rowSchema = z.object({
  flatNo: z.string().min(1, 'Flat number is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  contactMobile: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?\d[\d\s\-()]{8,}$/, 'Invalid phone number'),
  // Optional in file — if blank, the society default is injected before validation
  maintenanceAmount: z
    .string()
    .optional()
    .refine(v => !v || (!isNaN(Number(v)) && Number(v) > 0), 'Must be a positive number'),
  contactEmail: z
    .string()
    .optional()
    .refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Invalid email address'),
  statusCode: z
    .string()
    .optional()
    .refine(
      v => !v || VALID_STATUS_CODES.includes(v as typeof VALID_STATUS_CODES[number]),
        `Must be one of: Owner occupied, vacant, rented, under_maintenance`
    ),
});

// ---------------------------------------------------------------------------
// Header aliases — case-insensitive, whitespace-trimmed
// Maps common column name variations to canonical field names
// ---------------------------------------------------------------------------

const HEADER_ALIASES: Record<string, string> = {
  // flatNo
  'flatno': 'flatNo',
  'flat no': 'flatNo',
  'flat number': 'flatNo',
  'flat_no': 'flatNo',
  'flat_number': 'flatNo',
  'unit': 'flatNo',
  'unit no': 'flatNo',
  'unit number': 'flatNo',

  // ownerName
  'ownername': 'ownerName',
  'owner name': 'ownerName',
  'owner_name': 'ownerName',
  'owner': 'ownerName',
  'name': 'ownerName',

  // contactMobile
  'contactmobile': 'contactMobile',
  'contact mobile': 'contactMobile',
  'contact_mobile': 'contactMobile',
  'mobile': 'contactMobile',
  'phone': 'contactMobile',
  'phone number': 'contactMobile',
  'mobile number': 'contactMobile',
  'contact': 'contactMobile',

  // maintenanceAmount
  'maintenanceamount': 'maintenanceAmount',
  'maintenance amount': 'maintenanceAmount',
  'maintenance_amount': 'maintenanceAmount',
  'maintenance': 'maintenanceAmount',
  'amount': 'maintenanceAmount',
  'monthly amount': 'maintenanceAmount',

  // contactEmail
  'contactemail': 'contactEmail',
  'contact email': 'contactEmail',
  'contact_email': 'contactEmail',
  'email': 'contactEmail',
  'email address': 'contactEmail',

  // statusCode
  'statuscode': 'statusCode',
  'status code': 'statusCode',
  'status_code': 'statusCode',
  'status': 'statusCode',
};

function normalizeHeader(raw: string): string {
  // Strip decorators like *, (optional), (required), parenthetical suffixes, then trim
  const key = raw
    .replace(/\*/g, '')           // remove asterisks
    .replace(/\(.*?\)/g, '')      // remove anything in parentheses
    .trim()
    .toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

function normalizeRow(rawRow: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawRow)) {
    // Safely coerce to string — xlsx may return numeric cells as numbers even with raw:false
    out[normalizeHeader(k)] = String(v ?? '').trim();
  }
  return out;
}

// ---------------------------------------------------------------------------
// Parse a single row and return errors / valid data
// ---------------------------------------------------------------------------

function validateRow(normalized: Record<string, string>, rowIndex: number): ParsedFlatRow {
  const rawAmount = normalized['maintenanceAmount']?.trim();

  // Only validate the amount if the user actually provided one.
  // Blank = omit the field entirely so the backend applies its own maintenance config.
  const amountError = rawAmount && (isNaN(Number(rawAmount)) || Number(rawAmount) <= 0)
    ? 'Must be a positive number'
    : null;

  const result = rowSchema.safeParse({
    flatNo: normalized['flatNo'] ?? '',
    ownerName: normalized['ownerName'] ?? '',
    contactMobile: normalized['contactMobile'] ?? '',
    maintenanceAmount: rawAmount || undefined,
    contactEmail: normalized['contactEmail'] || undefined,
    statusCode: normalized['statusCode'] || undefined,
  });

  if (amountError) {
    const errors: Record<string, string> = { maintenanceAmount: amountError };
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (field !== 'maintenanceAmount') errors[field] = issue.message;
      }
    }
    return { rowIndex, raw: normalized, isValid: false, errors };
  }

  if (result.success) {
    const d = result.data;
    return {
      rowIndex,
      raw: normalized,
      isValid: true,
      errors: {},
      data: {
        flatNo: d.flatNo,
        ownerName: d.ownerName,
        contactMobile: d.contactMobile,
        contactEmail: d.contactEmail,
        // Only include if explicitly provided — backend uses its config when absent
        ...(rawAmount ? { maintenanceAmount: Number(rawAmount) } : {}),
        statusCode: d.statusCode ?? 'Owner occupied',
      },
    };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as string;
    errors[field] = issue.message;
  }

  return { rowIndex, raw: normalized, isValid: false, errors };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a CSV or Excel file and validate every data row.
 * Skips completely empty rows.
 * When Maintenance Amount is blank, the field is omitted from the payload
 * and the backend applies its own society maintenance config.
 */
export async function parseImportFile(file: File): Promise<ParsedFlatRow[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  let rawRows: Record<string, string>[];

  if (ext === 'csv') {
    rawRows = await parseCsv(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    rawRows = await parseExcel(file);
  } else {
    throw new Error('Unsupported file type. Please upload a .csv or .xlsx file.');
  }

  // Remove empty rows
  const nonEmpty = rawRows.filter(r => Object.values(r).some(v => v.trim() !== ''));

  return nonEmpty.map((row, idx) => validateRow(normalizeRow(row), idx));
}

function parseCsv(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // keep all values as strings
      complete: result => resolve(result.data as Record<string, string>[]),
      error: err => reject(new Error(err.message)),
    });
  });
}

function parseExcel(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false, // use formatted string representation
        });
        resolve(rows as Record<string, string>[]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}


export function downloadImportTemplate(): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Flats Data ────────────────────────────────────────────────
  const dataRows = [
    // Column header row — matches alias map exactly
    ['Flat No', 'Owner Name', 'Mobile', 'Email', 'Status'],

    // Sample rows — replace with your data
    ['101', 'Ramesh Kumar', '9876543210', 'ramesh@example.com', 'Owner occupied'],
    ['102', 'Sunita Mehta', '9123456789', '', 'vacant'],
    ['103', 'Arjun Patel', '9988776655', '', ''],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(dataRows);

  // Column widths
  ws1['!cols'] = [
    { wch: 14 }, // Flat No
    { wch: 22 }, // Owner Name
    { wch: 18 }, // Mobile
    { wch: 26 }, // Email
    { wch: 22 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Flats Data');

  // ── Sheet 2: Instructions ──────────────────────────────────────────────
  const instrRows = [
    ['FLATS IMPORT — INSTRUCTIONS'],
    [],
    ['Column', 'Required', 'Description', 'Example'],
    ['Flat No',    'YES', 'Unique flat / unit identifier', '101, A-201, B-12'],
    ['Owner Name', 'YES', 'Full name of the flat owner', 'Ramesh Kumar'],
    ['Mobile',     'YES', 'Contact mobile number (min 10 digits)', '9876543210'],
    ['Email',      'No',  'Owner email address', 'owner@example.com'],
    ['Status',     'No',  'One of: Owner occupied, vacant, rented, under_maintenance. Defaults to "Owner occupied" if blank.', 'Owner occupied'],
    [],
    ['NOTE: Maintenance Amount'],
    ['Maintenance amount is configured automatically from your society settings. You do not need to include it in the file.'],
    [],
    ['RULES'],
    ['• Delete the 3 sample rows (rows 2-4) before filling in your own data — or replace them directly.'],
    ['• Columns are case-insensitive — "Flat No", "flat no", "flatNo" all work.'],
    ['• Do NOT rename the "Flats Data" sheet; the importer reads the first sheet.'],
    ['• Rows with errors are highlighted in the preview and skipped — fix and re-import.'],
    ['• Maximum file size: 5 MB.'],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(instrRows);
  ws2['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 50 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');

  // ── Download ───────────────────────────────────────────────────────────
  XLSX.writeFile(wb, 'flats_import_template.xlsx');
}
