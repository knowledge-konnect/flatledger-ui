import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

interface DashboardStats {
  net_balance: number;
  total_flats: number;
  total_expense: number;
  collection_rate: number;
  paid_flats_count: number;
  total_collection: number;
  outstanding_amount: number;
  expected_collection: number;
  collection_change_percent: number;
  previous_month_collection: number;
}

interface MonthlyData {
  label: string;
  income: number;
  expense: number;
}

interface RecentActivity {
  date: string;
  type: 'expense' | 'payment';
  amount: number;
  description: string;
}

interface ExpenseBreakdown {
  amount: number;
  category: string;
  percentage: number;
}

interface DateRange {
  start: string;
  end: string;
}

export interface DashboardData {
  stats: DashboardStats;
  monthly: MonthlyData[];
  date_range: DateRange;
  recent_activity: RecentActivity[];
  expense_breakdown: ExpenseBreakdown[];
}

interface DashboardParams {
  startDate?: string;
  endDate?: string;
}

export function useDashboard(societyId: number | undefined, params?: DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', societyId, params?.startDate, params?.endDate],
    queryFn: async (): Promise<DashboardData> => {
      const queryParams = params?.startDate && params?.endDate 
        ? { startDate: params.startDate, endDate: params.endDate }
        : {};
      
      const response = await apiClient.get(`/api/dashboard/${societyId}`, {
        params: queryParams,
      });
      return response.data.data;
    },
    enabled: !!societyId,
  });
}
