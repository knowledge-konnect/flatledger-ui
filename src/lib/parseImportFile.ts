import Papa from 'papaparse';
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

const VALID_STATUS_CODES = ['owner_occupied', 'vacant', 'rented', 'under_maintenance'] as const;

// Maps human-readable / display-name variants (lowercased) → API code
const STATUS_ALIASES: Record<string, string> = {
  'owner occupied':      'owner_occupied',
  'owner_occupied':      'owner_occupied',
  'owneroccupied':       'owner_occupied',
  'owner':               'owner_occupied',
  'occupied':            'owner_occupied',
  'vacant':              'vacant',
  'empty':               'vacant',
  'unoccupied':          'vacant',
  'rented':              'rented',
  'tenant':              'rented',
  'on rent':             'rented',
  'on_rent':             'rented',
  'under maintenance':   'under_maintenance',
  'under_maintenance':   'under_maintenance',
  'maintenance':         'under_maintenance',
  'in maintenance':      'under_maintenance',
};

function normalizeStatusCode(raw: string): string {
  return STATUS_ALIASES[raw.trim().toLowerCase()] ?? raw.trim();
}

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
        `Must be one of: owner_occupied, vacant, rented, under_maintenance`
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
    statusCode: normalized['statusCode'] ? normalizeStatusCode(normalized['statusCode']) : undefined,
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
        statusCode: d.statusCode ?? 'owner_occupied',
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
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        // Dynamically import Workbook only when needed to avoid bundle bloat
        const { Workbook } = await import('exceljs');
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) { resolve([]); return; }

        const rows: Record<string, string>[] = [];
        const headers: string[] = [];

        sheet.eachRow((row, rowNum) => {
          if (rowNum === 1) {
            row.eachCell({ includeEmpty: true }, cell => {
              headers.push(String(cell.value ?? ''));
            });
          } else {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              const cell = row.getCell(i + 1);
              const raw = cell.value;
              // ExcelJS returns rich text as { richText: [...] }, dates as Date objects
              let val = '';
              if (raw === null || raw === undefined) {
                val = '';
              } else if (typeof raw === 'object' && 'richText' in (raw as object)) {
                val = (raw as { richText: { text: string }[] }).richText.map(r => r.text).join('');
              } else if (raw instanceof Date) {
                val = raw.toLocaleDateString();
              } else {
                val = String(raw);
              }
              obj[h] = val.trim();
            });
            rows.push(obj);
          }
        });

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}


export async function downloadImportTemplate(): Promise<void> {
  // Dynamically import ExcelJS only when template download is requested
  const { Workbook } = await import('exceljs');
  const wb = new Workbook();

  // Status display names — used in dropdown and sample rows
  // The parser normalises these to API codes via STATUS_ALIASES
  const STATUS_OPTIONS = ['Owner Occupied', 'Vacant', 'Rented', 'Under Maintenance'];

  // ── Sheet 1: Flats Data ────────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Flats Data');
  ws1.columns = [
    { header: 'Flat No',    key: 'flatNo',    width: 14 },
    { header: 'Owner Name', key: 'ownerName', width: 22 },
    { header: 'Mobile',     key: 'mobile',    width: 18 },
    { header: 'Email',      key: 'email',     width: 26 },
    { header: 'Status',     key: 'status',    width: 22 },
  ];

  const sampleRows = [
    ['101', 'Ramesh Kumar', '9876543210', 'ramesh@example.com', 'Owner Occupied'],
    ['102', 'Sunita Mehta', '9123456789', '', 'Vacant'],
    ['103', 'Arjun Patel', '9988776655', '', 'Rented'],
  ];
  sampleRows.forEach(r => ws1.addRow({ flatNo: r[0], ownerName: r[1], mobile: r[2], email: r[3], status: r[4] }));

  // Style header row
  ws1.getRow(1).font = { bold: true };

  // ── Sheet 2: Instructions ──────────────────────────────────────────────
  const ws2 = wb.addWorksheet('Instructions');
  ws2.columns = [{ width: 24 }, { width: 12 }, { width: 55 }, { width: 30 }];
  const instrRows = [
    ['FLATS IMPORT — INSTRUCTIONS'],
    [],
    ['Column', 'Required', 'Description', 'Example'],
    ['Flat No',    'YES', 'Unique flat / unit identifier', '101, A-201, B-12'],
    ['Owner Name', 'YES', 'Full name of the flat owner', 'Ramesh Kumar'],
    ['Mobile',     'YES', 'Contact mobile number (min 10 digits)', '9876543210'],
    ['Email',      'No',  'Owner email address', 'owner@example.com'],
    ['Status',     'No',  `Choose from: ${STATUS_OPTIONS.join(', ')}. Defaults to "Owner Occupied" if blank.`, 'Owner Occupied'],
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
  instrRows.forEach(r => ws2.addRow(r));
  ws2.getRow(1).font = { bold: true };
  ws2.getRow(3).font = { bold: true };

  // ── Sheet 3: Status Codes Reference ───────────────────────────────────
  const ws3 = wb.addWorksheet('Status Options');
  ws3.columns = [{ width: 28 }, { width: 22 }];
  const statusRows = [
    ['STATUS OPTIONS REFERENCE'],
    [],
    ['Display Name (use in file)', 'Internal Code'],
    ['Owner Occupied',  'owner_occupied'],
    ['Vacant',          'vacant'],
    ['Rented',          'rented'],
    ['Under Maintenance','under_maintenance'],
    [],
    ['The Status column in "Flats Data" has a dropdown — just pick a value.'],
    ['If left blank, "Owner Occupied" is used by default.'],
  ];
  statusRows.forEach(r => ws3.addRow(r));
  ws3.getRow(1).font = { bold: true };
  ws3.getRow(3).font = { bold: true };

  // ── Download via Blob URL ────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flats_import_template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
