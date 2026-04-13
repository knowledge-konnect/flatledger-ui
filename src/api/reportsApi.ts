import apiClient from './client';

/* =====================================================
   TYPES — Collection Summary
===================================================== */
export interface CollectionPeriod {
  period: string;
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  flats_billed: number;
  flats_paid: number;
  flats_partial: number;
  flats_unpaid: number;
}

export interface CollectionSummaryData {
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  total_flats: number;
  collection_percentage?: number;
  periods: CollectionPeriod[];
}

/* =====================================================
   TYPES — Defaulters
===================================================== */
export interface DefaulterEntry {
  flat_no: string;
  owner_name: string;
  contact_mobile: string;
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  pending_months: number;
  oldest_due_period: string;
  latest_due_period: string;
}

/* =====================================================
   TYPES — Income vs Expense
===================================================== */
export interface IncomeExpenseMonth {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface IncomeVsExpenseData {
  total_income: number;
  total_expense: number;
  net_balance: number;
  months: IncomeExpenseMonth[];
}

/* =====================================================
   TYPES — Fund Ledger
===================================================== */
export interface FundLedgerEntry {
  date: string;
  entry_type: 'credit' | 'debit' | 'opening_fund' | string;
  credit: number;
  debit: number;
  running_balance: number;
  reference: string | null;
  notes: string | null;
}

export interface FundLedgerData {
  opening_balance: number;
  total_collections: number;
  total_expenses: number;
  total_opening_fund: number;
  closing_balance: number;
  /** Legacy aliases kept for backward compat */
  total_credits?: number;
  total_debits?: number;
  entries: FundLedgerEntry[];
}

/* =====================================================
   TYPES — Payment Register
===================================================== */
export interface PaymentRegisterEntry {
  date_paid:    string | null;
  flat_no:      string;
  owner_name:   string;
  amount:       number;
  payment_mode: string | null;
  reference:    string | null;
  notes:        string | null;
  period:       string | null;  // YYYY-MM e.g. "2026-02"
  period_label: 'Current' | 'Arrear' | 'Advance' | null;
  recorded_by:  string | null;
}

export interface PaymentRegisterPage {
  entries:  PaymentRegisterEntry[];
  total:    number;
  page:     number;
  pageSize: number;
}

/* =====================================================
   TYPES — Expense by Category
===================================================== */
export interface ExpenseCategory {
  category: string;
  category_code: string;
  total_amount: number;
  total_entries: number;
  first_expense_date: string;
  last_expense_date: string;
}

export interface ExpenseByCategoryData {
  total_expense: number;
  categories: ExpenseCategory[];
}

/* =====================================================
   API FUNCTIONS
===================================================== */
const reportsApi = {
  getCollectionSummary: async (startPeriod?: string, endPeriod?: string) => {
    const params = new URLSearchParams();
    if (startPeriod) params.append('startPeriod', startPeriod);
    if (endPeriod) params.append('endPeriod', endPeriod);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ success: boolean; data?: CollectionSummaryData }>(
      `/reports/collection-summary${query}`
    );
    const payload = res.data?.data ?? (res.data as unknown as CollectionSummaryData);
    return payload;
  },

  getDefaulters: async (minOutstanding = 0, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('minOutstanding', String(minOutstanding));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await apiClient.get<{ success: boolean; data?: DefaulterEntry[] }>(
      `/reports/defaulters?${params.toString()}`
    );
    // Backend may return multiple shapes:
    // 1) { success: true, data: [ ...entries ] }
    // 2) [ { get_defaulters_report: [ ...entries ] } ]
    // 3) { success: true, data: [ { get_defaulters_report: [ ...entries ] } ] }
    // 4) { data: { get_defaulters_report: [ ...entries ] } }
    // 5) directly an array of entries
    const raw = res.data as any;

    const toEntries = (value: any): DefaulterEntry[] | undefined => {
      if (!value) return undefined;

      if (Array.isArray(value)) {
        if (value.length === 0) return [];

        // [{ get_defaulters_report: [...] }]
        if (Array.isArray(value[0]?.get_defaulters_report)) {
          return value[0].get_defaulters_report as DefaulterEntry[];
        }

        // Direct array of entries
        return value as DefaulterEntry[];
      }

      if (Array.isArray(value?.get_defaulters_report)) {
        return value.get_defaulters_report as DefaulterEntry[];
      }

      return undefined;
    };

    return toEntries(raw?.data) ?? toEntries(raw) ?? [];
  },

  getIncomeVsExpense: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ success: boolean; data?: IncomeVsExpenseData }>(
      `/reports/income-vs-expense${query}`
    );
    const payload = res.data?.data ?? (res.data as unknown as IncomeVsExpenseData);
    return payload;
  },

  getFundLedger: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ success: boolean; data?: FundLedgerData }>(
      `/reports/fund-ledger${query}`
    );
    const payload = res.data?.data ?? (res.data as unknown as FundLedgerData);
    return payload;
  },

  getPaymentRegister: async (startDate?: string, endDate?: string, page = 1, pageSize = 50): Promise<PaymentRegisterPage> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/reports/payment-register?${params.toString()}`
    );
    const d = res.data?.data ?? res.data;
    const entries: PaymentRegisterEntry[] = Array.isArray(d?.items)
      ? d.items
      : Array.isArray(d?.entries)
      ? d.entries
      : [];
    const finalTotal = Number(d?.totalCount ?? d?.total ?? entries.length) || 0;
    return {
      entries,
      total: finalTotal,
      page: Number(d?.page ?? page) || page,
      pageSize: Number(d?.pageSize ?? pageSize) || pageSize,
    };
  },

  getExpenseByCategory: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ success: boolean; data?: ExpenseByCategoryData }>(
      `/reports/expense-by-category${query}`
    );
    const payload = res.data?.data ?? (res.data as unknown as ExpenseByCategoryData);
    return payload;
  },

  downloadMonthlyReport: async (year: number, month: number, filename?: string): Promise<void> => {
    let blob: Blob;
    let resolvedFilename = filename || `Monthly_Report_${year}_${String(month).padStart(2, '0')}.xlsx`;
    try {
      const res = await apiClient.get(
        `/reports/download/monthly?year=${year}&month=${month}`,
        { responseType: 'blob' }
      );
      blob = res.data as Blob;
      if (!filename) {
        const disposition = res.headers?.['content-disposition'] as string | undefined;
        const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^"\n;]+)"?/i);
        if (match?.[1]) resolvedFilename = decodeURIComponent(match[1].trim());
      }
    } catch (err: any) {
      // Parse error blob to extract backend message
      const raw = err?.response?.data;
      if (raw instanceof Blob) {
        const text = await raw.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json?.message || 'Failed to download monthly report');
        } catch {
          throw new Error('Failed to download monthly report');
        }
      }
      throw new Error(err?.response?.data?.message || err?.message || 'Failed to download monthly report');
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resolvedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  downloadYearlyReport: async (year: number, yearType: 'financial' | 'calendar', filename?: string): Promise<void> => {
    let blob: Blob;
    let resolvedFilename = filename || (yearType === 'financial'
      ? `Yearly_Report_FY_${year - 1}-${String(year).slice(2)}.xlsx`
      : `Yearly_Report_${year}.xlsx`);
    try {
      const res = await apiClient.get(
        `/reports/download/yearly?year=${year}&yearType=${yearType}`,
        { responseType: 'blob' }
      );
      blob = res.data as Blob;
      if (!filename) {
        const disposition = res.headers?.['content-disposition'] as string | undefined;
        const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^"\n;]+)"?/i);
        if (match?.[1]) resolvedFilename = decodeURIComponent(match[1].trim());
      }
    } catch (err: any) {
      const raw = err?.response?.data;
      if (raw instanceof Blob) {
        const text = await raw.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json?.message || 'Failed to download yearly report');
        } catch {
          throw new Error('Failed to download yearly report');
        }
      }
      throw new Error(err?.response?.data?.message || err?.message || 'Failed to download yearly report');
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resolvedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export default reportsApi;
