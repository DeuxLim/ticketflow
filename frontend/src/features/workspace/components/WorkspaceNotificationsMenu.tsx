import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  listWorkspaceNotifications,
  markAllWorkspaceNotificationsRead,
  markWorkspaceNotificationRead,
} from '@/features/workspace/api/notificationsApi';
import type { WorkspaceNotification } from '@/types/api';

type Props = {
  workspaceSlug?: string;
};

export function WorkspaceNotificationsMenu({ workspaceSlug }: Props) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'notifications'],
    queryFn: () => listWorkspaceNotifications(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug),
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'notifications'] });
  };

  const markRead = useMutation({
    mutationFn: (notificationId: number) => markWorkspaceNotificationRead(workspaceSlug ?? '', notificationId),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllWorkspaceNotificationsRead(workspaceSlug ?? ''),
    onSuccess: invalidate,
  });

  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = notificationsQuery.data?.meta.unread_count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        render={
          <Button className="relative" size="sm" type="button" variant="outline">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-2 -top-2 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[360px]">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            size="sm"
            type="button"
            variant="ghost"
          >
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            workspaceSlug={workspaceSlug}
            onMarkRead={() => markRead.mutate(notification.id)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({
  notification,
  workspaceSlug,
  onMarkRead,
}: {
  notification: WorkspaceNotification;
  workspaceSlug?: string;
  onMarkRead: () => void;
}) {
  const href = notification.ticket_id && workspaceSlug
    ? `/workspaces/${workspaceSlug}/tickets/${notification.ticket_id}`
    : `/workspaces/${workspaceSlug}`;

  return (
    <DropdownMenuItem className="items-start gap-3 p-0" onSelect={(event) => event.preventDefault()}>
      <Link className="min-w-0 flex-1 px-2 py-2" to={href}>
        <div className="flex items-center gap-2">
          {!notification.read_at && <span className="size-2 rounded-full bg-primary" />}
          <p className="truncate text-sm font-medium">{notification.title}</p>
        </div>
        {notification.body && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>}
        {notification.ticket && (
          <p className="mt-1 text-xs text-muted-foreground">
            {notification.ticket.ticket_number} · {notification.ticket.status.replace('_', ' ')}
          </p>
        )}
      </Link>
      {!notification.read_at && (
        <Button className="mr-2 mt-2" onClick={onMarkRead} size="sm" type="button" variant="ghost">
          Read
        </Button>
      )}
    </DropdownMenuItem>
  );
}
