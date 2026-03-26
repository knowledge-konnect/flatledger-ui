import { useQuery } from '@tanstack/react-query';
import apiClient, { getInMemoryAccessToken } from '../api/client';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface DashboardPeriod {
  start: string;
  end: string;
  period_key?: string;
}

export interface DashboardSnapshot {
  total_flats: number;
  total_billed: number;
  total_collected: number;
  collection_rate: number;
  bill_outstanding: number;
  period_bill_outstanding?: number;
  all_time_bill_outstanding?: number;
  opening_dues_remaining: number;
  total_member_outstanding: number;
  all_time_member_outstanding?: number;
  total_expense: number;
  net_cash_flow: number;
  bank_balance: number;
  opening_fund_balance?: number;
  period_fund_inflow?: number;
  period_fund_outflow?: number;
  closing_fund_balance?: number;
  present_balance?: number;
}

export interface TrendMeta {
  window_months?: number;
  end_month?: string;
}

export interface TrendItem {
  label: string;
  income: number;
  expense: number;
}

export interface ExpenseBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface TopDefaulter {
  flat_no: string;
  outstanding: number;
}

export interface RecentActivityItem {
  type: 'payment' | 'expense';
  amount: number;
  date: string;
  description: string;
}

export interface DashboardResponse {
  period: DashboardPeriod;
  snapshot: DashboardSnapshot;
  trend_meta?: TrendMeta;
  trends: TrendItem[];
  expense_breakdown: ExpenseBreakdownItem[];
  top_defaulters: TopDefaulter[];
  recent_activity: RecentActivityItem[];
}

// ─── Params ───────────────────────────────────────────────────────────────────

interface DashboardParams {
  startDate?: string;
  endDate?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard(params?: DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', params?.startDate, params?.endDate],
    queryFn: async (): Promise<DashboardResponse> => {
      const queryParams =
        params?.startDate && params?.endDate
          ? { startDate: params.startDate, endDate: params.endDate }
          : {};
      const response = await apiClient.get('/dashboard', { params: queryParams });
      return response.data.data;
    },
    enabled: !!getInMemoryAccessToken(),
    staleTime: 0,
  });
}
