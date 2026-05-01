import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mutationErrorMessage } from '@/features/workspace/pages/ticketDetailsHelpers';
import type { Ticket } from '@/types/api';

type TicketDetailsWatchersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchers: NonNullable<Ticket['watchers']>;
  mutationError: unknown;
};

export function TicketDetailsWatchersDialog({
  open,
  onOpenChange,
  watchers,
  mutationError,
}: TicketDetailsWatchersDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Watchers</DialogTitle>
          <DialogDescription>See who is following the ticket and keeping up with updates.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {watchers.map((watcher) => (
              <Badge key={watcher.id} variant="secondary">
                {watcher.user ? `${watcher.user.first_name} ${watcher.user.last_name}` : `User ${watcher.user_id}`}
              </Badge>
            ))}
          </div>
          {!watchers.length && <p className="text-sm text-muted-foreground">No followers yet.</p>}
          {mutationError ? (
            <p className="text-xs text-destructive">{mutationErrorMessage(mutationError)}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
