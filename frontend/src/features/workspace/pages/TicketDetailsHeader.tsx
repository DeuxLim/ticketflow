import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        <Badge variant="outline">{ticket.ticket_number}</Badge>
        <Badge variant="secondary">{ticket.status}</Badge>
        <Badge variant="outline">{ticket.priority}</Badge>
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{ticket.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{ticket.description}</p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        Keep the thread readable by leaving summary and activity in view, then open focused panels when you need to edit metadata or manage supporting work.
      </p>

      {quickActionMessage && <p className="text-xs text-muted-foreground">{quickActionMessage}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {nextStatuses(ticket.status).map((next) => (
          <Button
            key={next}
            disabled={!canManage || isTransitioning}
            onClick={() => onTransition(next)}
            size="sm"
            type="button"
            variant="outline"
          >
            Move to {next.replace('_', ' ')}
          </Button>
        ))}
        <Button disabled={!canComment} onClick={onOpenComment} size="sm" type="button">
          Add Comment
        </Button>
        <Button
          disabled={!canComment || isWatcherMutating || isLoadingCurrentUser}
          onClick={() => {
            if (selfWatcher) {
              onUnfollowTicket(selfWatcher.id);
            } else {
              onFollowTicket();
            }
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          {selfWatcher ? 'Unfollow' : 'Follow'}
        </Button>
        <Button disabled={!canManage} onClick={onOpenEdit} size="sm" type="button" variant="outline">
          Edit Ticket
        </Button>
        <Button disabled={!canManage || isDeletingTicket} onClick={onDeleteTicket} size="sm" type="button" variant="outline">
          {isDeletingTicket ? 'Deleting...' : 'Delete Ticket'}
        </Button>
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
