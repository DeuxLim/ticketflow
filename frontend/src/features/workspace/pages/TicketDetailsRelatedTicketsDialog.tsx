import type { UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  mutationErrorMessage,
  statusLabel,
  type RelatedTicketForm,
} from '@/features/workspace/pages/ticketDetailsHelpers';
import type { Ticket } from '@/types/api';

export type RelatedTicketOption = {
  id: number;
  ticket_number: string;
  title: string;
};

type TicketDetailsRelatedTicketsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug?: string;
  canManage: boolean;
  form: UseFormReturn<RelatedTicketForm>;
  onSubmit: (values: RelatedTicketForm) => void;
  relatedTickets: NonNullable<Ticket['related_tickets']>;
  relatedTicketOptions: RelatedTicketOption[];
  relatedTicketsCoverageHint: string | null;
  relatedTicketIdValue?: string;
  relatedTicketRelationshipValue?: string;
  onDeleteRelatedTicket: (link: NonNullable<Ticket['related_tickets']>[number]) => void;
  isPending: boolean;
  mutationError: unknown;
};

export function TicketDetailsRelatedTicketsDialog({
  open,
  onOpenChange,
  workspaceSlug,
  canManage,
  form,
  onSubmit,
  relatedTickets,
  relatedTicketOptions,
  relatedTicketsCoverageHint,
  relatedTicketIdValue,
  relatedTicketRelationshipValue,
  onDeleteRelatedTicket,
  isPending,
  mutationError,
}: TicketDetailsRelatedTicketsDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Related Tickets</DialogTitle>
          <DialogDescription>Connect incidents, blockers, duplicates, or follow-up work from one focused panel.</DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex flex-col gap-3">
          {relatedTickets.map((link) => (
            <div key={link.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {link.ticket ? (
                    <Link className="font-medium underline-offset-4 hover:underline" to={`/workspaces/${workspaceSlug}/tickets/${link.ticket.id}`}>
                      {link.ticket.ticket_number}
                    </Link>
                  ) : (
                    <p className="font-medium">Ticket {link.related_ticket_id}</p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">{link.ticket?.title ?? 'Related ticket'}</p>
                </div>
                <Badge variant="outline">{statusLabel(link.relationship_type)}</Badge>
              </div>
              {canManage && (
                <Button
                  className="mt-2"
                  disabled={isPending}
                  onClick={() => onDeleteRelatedTicket(link)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          {!relatedTickets.length && <p className="text-sm text-muted-foreground">No related tickets yet.</p>}
        </div>

        <form className="space-y-3" id="related-ticket-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Ticket</Label>
            <Select
              onValueChange={(value) => form.setValue('related_ticket_id', value ?? '', { shouldValidate: true })}
              value={relatedTicketIdValue ?? ''}
            >
              <SelectTrigger><SelectValue placeholder="Select ticket" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {relatedTicketOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.ticket_number} - {option.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {relatedTicketsCoverageHint && (
              <p className="text-xs text-muted-foreground">{relatedTicketsCoverageHint}</p>
            )}
            {form.formState.errors.related_ticket_id && <p className="text-xs text-destructive">{form.formState.errors.related_ticket_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select
              onValueChange={(value) => form.setValue('relationship_type', value ?? 'related', { shouldValidate: true })}
              value={relatedTicketRelationshipValue ?? 'related'}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="related">Related</SelectItem>
                  <SelectItem value="blocks">Blocks</SelectItem>
                  <SelectItem value="blocked_by">Blocked By</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="caused_by">Caused By</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {form.formState.errors.relationship_type && <p className="text-xs text-destructive">{form.formState.errors.relationship_type.message}</p>}
          </div>
        </form>

        {mutationError ? (
          <p className="text-xs text-destructive">{mutationErrorMessage(mutationError)}</p>
        ) : null}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending || form.formState.isSubmitting} form="related-ticket-form" type="submit">
            {isPending ? 'Linking...' : 'Link Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
