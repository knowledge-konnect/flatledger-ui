import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationPreference, UpdateNotificationPreferenceDto } from '../api/notificationsApi';

/**
 * Hook: useNotifications
 * Purpose: Fetches the current user's notification preferences.
 */
export const useNotifications = () => {
  return useQuery<NotificationPreference>({
    queryKey: ['notifications-preferences'],
    queryFn: () => notificationsApi.getPreferences()
  });
};

/**
 * Hook: useUpdateNotifications
 * Purpose: Updates notification preferences and refreshes the cached preferences.
 */
export const useUpdateNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NotificationPreference, Error, UpdateNotificationPreferenceDto>({
    mutationFn: (payload) => notificationsApi.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-preferences'] });
    }
  });
};
