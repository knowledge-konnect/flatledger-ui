import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActivityLogs,
  getRecentActivityLogs,
  createActivityLog,
  getEntityActivityLogs,
  getUserActivityLogs,
  GetActivityLogsParams,
  CreateActivityLogRequest,
} from '../api/activityLogsApi';
import { ActivityLog } from '../types';
import { logger } from '../lib/logger';

/* =====================================================
   QUERIES
===================================================== */

/**
 * Get all activity logs with optional filters
 */
export function useActivityLogs(params: GetActivityLogsParams = {}) {
  return useQuery({
    queryKey: ['activityLogs', params],
    queryFn: async (): Promise<ActivityLog[]> => {
      logger.log('[useActivityLogs] Fetching activity logs', params);
      const result = await getActivityLogs(params);
      logger.log(`[useActivityLogs] Loaded ${result.length} activity logs`);
      return result;
    },
  });
}

/**
 * Get recent activity logs for a society
 */
export function useRecentActivityLogs(societyId?: string, limit: number = 10) {
  return useQuery({
    queryKey: ['activityLogs', 'recent', societyId, limit],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!societyId) throw new Error('Society ID is required');
      logger.log(`[useRecentActivityLogs] Fetching ${limit} recent logs for society ${societyId}`);
      const result = await getRecentActivityLogs(societyId, limit);
      logger.log(`[useRecentActivityLogs] Loaded ${result.length} recent logs`);
      return result;
    },
    enabled: !!societyId,
  });
}

/**
 * Get activity logs for a specific entity
 */
export function useEntityActivityLogs(entityType?: string, entityId?: string) {
  return useQuery({
    queryKey: ['activityLogs', 'entity', entityType, entityId],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!entityType || !entityId) throw new Error('Entity type and ID are required');
      logger.log(`[useEntityActivityLogs] Fetching logs for ${entityType}:${entityId}`);
      const result = await getEntityActivityLogs(entityType, entityId);
      logger.log(`[useEntityActivityLogs] Loaded ${result.length} logs`);
      return result;
    },
    enabled: !!entityType && !!entityId,
  });
}

/**
 * Get activity logs by user
 */
export function useUserActivityLogs(userId?: string, limit?: number) {
  return useQuery({
    queryKey: ['activityLogs', 'user', userId, limit],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!userId) throw new Error('User ID is required');
      logger.log(`[useUserActivityLogs] Fetching logs for user ${userId}`);
      const result = await getUserActivityLogs(userId, limit);
      logger.log(`[useUserActivityLogs] Loaded ${result.length} user logs`);
      return result;
    },
    enabled: !!userId,
  });
}

/* =====================================================
   MUTATIONS
===================================================== */

/**
 * Create a new activity log entry
 */
export function useCreateActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateActivityLogRequest): Promise<ActivityLog> => {
      logger.log('[useCreateActivityLog] Creating activity log', data);
      const result = await createActivityLog(data);
      logger.log(`[useCreateActivityLog] Created log: ${result.id}`);
      return result;
    },
    onSuccess: (data) => {
      // Invalidate all activity log queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] });
      logger.log(`[useCreateActivityLog] Successfully created log for ${data.entityType}:${data.entityId}`);
    },
    onError: (error) => {
      logger.error('[useCreateActivityLog] Error creating activity log:', error);
    },
  });
}

/**
 * Helper hook to log an action programmatically
 */
export function useLogActivity() {
  const { mutateAsync } = useCreateActivityLog();

  return async (
    action: CreateActivityLogRequest['action'],
    entityType: CreateActivityLogRequest['entityType'],
    entityId: string,
    options?: {
      entityName?: string;
      details?: string;
      amount?: number;
      userId?: string;
      userName?: string;
      societyId?: string;
    }
  ) => {
    try {
      await mutateAsync({
        action,
        entityType,
        entityId,
        ...options,
      } as CreateActivityLogRequest);
    } catch (error) {
      logger.error('[useLogActivity] Failed to log activity:', error);
      // Silently fail - logging should not break the main flow
    }
  };
}
