import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationFilters } from '@/services/notification.service';

export const useNotifications = (filters?: NotificationFilters) => {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationService.getNotifications(filters),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
};

