import { apiRequest } from '@/services/api/client';
import type { WorkspaceNotification } from '@/types/api';

export function listWorkspaceNotifications(workspaceSlug: string) {
  return apiRequest<{ data: WorkspaceNotification[]; meta: { unread_count: number } }>(`/workspaces/${workspaceSlug}/notifications`);
}

export function markWorkspaceNotificationRead(workspaceSlug: string, notificationId: number) {
  return apiRequest<{ data: WorkspaceNotification }>(`/workspaces/${workspaceSlug}/notifications/${notificationId}/read`, {
    method: 'POST',
  });
}

export function markAllWorkspaceNotificationsRead(workspaceSlug: string) {
  return apiRequest<{ message: string }>(`/workspaces/${workspaceSlug}/notifications/read-all`, {
    method: 'POST',
  });
}
