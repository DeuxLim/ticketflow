import { PriorityBadge, RowActionMenu, StatusBadge } from '@/components/app';
import { Button } from '@/components/ui/button';
import { ticketStatusLabel } from '@/features/workspace/pages/ticketForm';
import type { Ticket, TicketWatcher } from '@/types/api';

type TicketDetailsHeaderProps = {
  ticket: Ticket;
  quickActionMessage: string | null;
  canComment: boolean;
  canManage: boolean;
  selfWatcher?: TicketWatcher;
  isTransitioning: boolean;
  isWatcherMutating: boolean;
  isLoadingCurrentUser: boolean;
  isDeletingTicket: boolean;
  onTransition: (status: Ticket['status']) => void;
  onOpenComment: () => void;
  onFollowTicket: () => void;
  onUnfollowTicket: (watcherId: number) => void;
  onOpenEdit: () => void;
  onDeleteTicket: () => void;
};

export function TicketDetailsHeader({
  ticket,
  quickActionMessage,
  canComment,
  canManage,
  selfWatcher,
  isTransitioning,
  isWatcherMutating,
  isLoadingCurrentUser,
  isDeletingTicket,
  onTransition,
  onOpenComment,
  onFollowTicket,
  onUnfollowTicket,
  onOpenEdit,
  onDeleteTicket,
}: TicketDetailsHeaderProps) {
  return (
    <header className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status="closed" label={ticket.ticket_number} />
        <StatusBadge status={ticket.status} label={ticketStatusLabel(ticket.status)} />
        <PriorityBadge priority={ticket.priority} />
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">{ticket.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{ticket.description}</p>

      {quickActionMessage && <p className="text-xs text-muted-foreground">{quickActionMessage}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button disabled={!canComment} onClick={onOpenComment} size="sm" type="button">
          Add Comment
        </Button>
        <Button disabled={!canManage} onClick={onOpenEdit} size="sm" type="button" variant="outline">
          Edit Ticket
        </Button>
        <RowActionMenu
          label={`More actions for ${ticket.ticket_number}`}
          actions={[
            ...nextStatuses(ticket.status).map((next) => ({
              label: `Move to ${ticketStatusLabel(next)}`,
              onSelect: () => onTransition(next),
              disabled: !canManage || isTransitioning,
            })),
            {
              label: selfWatcher ? 'Unfollow' : 'Follow',
              onSelect: () => {
                if (selfWatcher) {
                  onUnfollowTicket(selfWatcher.id);
                } else {
                  onFollowTicket();
                }
              },
              disabled: !canComment || isWatcherMutating || isLoadingCurrentUser,
            },
            {
              label: isDeletingTicket ? 'Deleting...' : 'Delete Ticket',
              onSelect: onDeleteTicket,
              disabled: !canManage || isDeletingTicket,
              destructive: true,
            },
          ]}
        />
      </div>
    </header>
  );
}

function nextStatuses(current: Ticket['status']): Ticket['status'][] {
  const map: Record<Ticket['status'], Ticket['status'][]> = {
    open: ['in_progress', 'pending', 'closed'],
    in_progress: ['pending', 'resolved', 'closed'],
    pending: ['in_progress', 'resolved', 'closed'],
    resolved: ['closed', 'in_progress'],
    closed: ['in_progress'],
  };

  return map[current] ?? [];
}
