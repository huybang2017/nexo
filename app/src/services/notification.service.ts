import api from '@/lib/api';
import type { ApiResponse, PageResponse, Notification } from '@/types';

export interface NotificationFilters {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

export const notificationService = {
  async getNotifications(filters?: NotificationFilters): Promise<PageResponse<Notification> & { unreadCount: number }> {
    const params = new URLSearchParams();
    if (filters?.unreadOnly) params.append('unreadOnly', 'true');
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Notification> & { unreadCount: number }>>(`/notifications?${params}`);
    return response.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data.data.count;
  },

  async markAsRead(id: number): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};

export default notificationService;

