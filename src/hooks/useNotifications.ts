import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationPreference, UpdateNotificationPreferenceDto } from '../api/notificationsApi';

export const useNotifications = () => {
  return useQuery<NotificationPreference>({
    queryKey: ['notifications-preferences'],
    queryFn: () => notificationsApi.getPreferences()
  });
};

export const useUpdateNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NotificationPreference, Error, UpdateNotificationPreferenceDto>({
    mutationFn: (payload) => notificationsApi.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-preferences'] });
    }
  });
};
