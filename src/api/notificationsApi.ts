import { ApiResponse } from '../types/api';
import apiClient from './client';

export interface NotificationPreference {
  id: string;
  userId: string;
  paymentReminders: boolean;
  billGenerated: boolean;
  expenseUpdates: boolean;
  monthlyReports: boolean;
  updatedAt: string;
}

export interface UpdateNotificationPreferenceDto {
  paymentReminders?: boolean;
  billGenerated?: boolean;
  expenseUpdates?: boolean;
  monthlyReports?: boolean;
}

export const notificationsApi = {
  async getPreferences(): Promise<NotificationPreference> {
    const response = await apiClient.get<ApiResponse<NotificationPreference>>('/notifications/preferences');
    return response.data.data;
  },

  async updatePreferences(payload: UpdateNotificationPreferenceDto): Promise<NotificationPreference> {
    const response = await apiClient.put<ApiResponse<NotificationPreference>>('/notifications/preferences', payload);
    return response.data.data;
  }
};
