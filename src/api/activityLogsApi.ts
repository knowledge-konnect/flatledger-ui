import { ApiResponse } from '../types/api';
import { ActivityLog } from '../types';
import { unwrapArrayData } from './responseUtils';
import apiClient from './client';

/* =====================================================
   TYPES & INTERFACES
===================================================== */

export interface GetActivityLogsParams {
  societyId?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface CreateActivityLogRequest {
  userId: string;
  userName?: string;
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'generated';
  entityType: 'payment' | 'expense' | 'bill' | 'flat' | 'user';
  entityId: string;
  entityName?: string;
  details?: string;
  amount?: number;
  societyId?: string;
}

/* =====================================================
   API FUNCTIONS
===================================================== */

/**
 * Get activity logs with optional filtering
 */
export const getActivityLogs = async (params: GetActivityLogsParams = {}): Promise<ActivityLog[]> => {
  const response = await apiClient.get<ApiResponse<ActivityLog[]>>('/api/activity-logs', {
    params: {
      societyId: params.societyId,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: params.limit || 50,
      offset: params.offset || 0,
    },
  });
  return unwrapArrayData(response);
};

/**
 * Get recent activity logs for a society
 */
export const getRecentActivityLogs = async (societyId: string, limit: number = 10): Promise<ActivityLog[]> => {
  return getActivityLogs({ societyId, limit });
};

/**
 * Create a new activity log entry
 */
export const createActivityLog = async (data: CreateActivityLogRequest): Promise<ActivityLog> => {
  const response = await apiClient.post<ApiResponse<ActivityLog>>('/api/activity-logs', data);
  return response.data.data;
};

/**
 * Get activity logs for a specific entity
 */
export const getEntityActivityLogs = async (
  entityType: string,
  entityId: string
): Promise<ActivityLog[]> => {
  return getActivityLogs({ entityType, entityId });
};

/**
 * Get activity logs by user
 */
export const getUserActivityLogs = async (
  userId: string,
  limit?: number
): Promise<ActivityLog[]> => {
  return getActivityLogs({ userId, limit });
};
