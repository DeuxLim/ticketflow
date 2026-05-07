import { Link } from 'react-router-dom';
import { EmptyState, PriorityBadge, RowActionMenu, StatusBadge } from '@/components/app';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ticketStatusLabel } from '@/features/workspace/pages/ticketForm';
import type { ApiPaginationMeta, Ticket } from '@/types/api';

type TicketQueueTableProps = {
  workspaceSlug?: string;
  tickets: Ticket[];
  isLoading: boolean;
  errorMessage: string | null;
  hasActiveFilters: boolean;
  pagination?: ApiPaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  selectedTicketIds: number[];
  selectedVisibleTicketIds: number[];
  onSelectedTicketIdsChange: (ticketIds: number[]) => void;
  canManage: boolean;
  deletePending: boolean;
  assignmentPendingTicketId: number | null;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
  onOpenAssign: (ticket: Ticket) => void;
};

export function TicketQueueTable({
  workspaceSlug,
  tickets,
  isLoading,
  errorMessage,
  hasActiveFilters,
  pagination,
  page,
  onPageChange,
  selectedTicketIds,
  selectedVisibleTicketIds,
  onSelectedTicketIdsChange,
  canManage,
  deletePending,
  assignmentPendingTicketId,
  onEdit,
  onDelete,
  onOpenAssign,
}: TicketQueueTableProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tickets...</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        title={hasActiveFilters ? 'No tickets match these filters.' : 'No tickets yet.'}
        description={hasActiveFilters
          ? 'Reset search or filters to return to the full queue.'
          : 'Create the first ticket to start tracking support work.'}
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  aria-label="Select all tickets"
                  checked={tickets.length > 0 && selectedVisibleTicketIds.length === tickets.length}
                  onChange={(event) => {
                    if (event.target.checked) {
                      onSelectedTicketIdsChange(tickets.map((ticket) => ticket.id));
                      return;
                    }

                    onSelectedTicketIdsChange([]);
                  }}
                  type="checkbox"
                />
              </TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <input
                    aria-label={`Select ticket ${ticket.ticket_number}`}
                    checked={selectedTicketIds.includes(ticket.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        onSelectedTicketIdsChange([...selectedTicketIds, ticket.id]);
                        return;
                      }

                      onSelectedTicketIdsChange(selectedTicketIds.filter((id) => id !== ticket.id));
                    }}
                    type="checkbox"
                  />
                </TableCell>
                <TableCell>
                  <Link className="font-medium underline-offset-4 hover:underline" to={`/workspaces/${workspaceSlug}/tickets/${ticket.id}`}>
                    {ticket.ticket_number}
                  </Link>
                  <p className="text-xs text-muted-foreground">{ticket.title}</p>
                </TableCell>
                <TableCell>{ticket.customer?.name ?? '—'}</TableCell>
                <TableCell>
                  <span className="text-sm">{assigneeName(ticket)}</span>
                  {assignmentPendingTicketId === ticket.id ? <p className="text-xs text-muted-foreground">Updating...</p> : null}
                </TableCell>
                <TableCell><StatusBadge status={ticket.status} label={ticketStatusLabel(ticket.status)} /></TableCell>
                <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <RowActionMenu
                      label={`Actions for ${ticket.ticket_number}`}
                      actions={[
                        { label: 'Assign', onSelect: () => onOpenAssign(ticket), disabled: !canManage },
                        { label: 'Edit', onSelect: () => onEdit(ticket), disabled: !canManage },
                        { label: 'Delete', onSelect: () => onDelete(ticket), disabled: !canManage || deletePending, destructive: true },
                      ]}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link className="font-medium underline-offset-4 hover:underline" to={`/workspaces/${workspaceSlug}/tickets/${ticket.id}`}>
                  {ticket.ticket_number}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ticket.title}</p>
              </div>
              <RowActionMenu
                label={`Actions for ${ticket.ticket_number}`}
                actions={[
                  { label: 'Assign', onSelect: () => onOpenAssign(ticket), disabled: !canManage },
                  { label: 'Edit', onSelect: () => onEdit(ticket), disabled: !canManage },
                  { label: 'Delete', onSelect: () => onDelete(ticket), disabled: !canManage || deletePending, destructive: true },
                ]}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={ticket.status} label={ticketStatusLabel(ticket.status)} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Customer</dt>
                <dd className="mt-1 truncate font-medium">{ticket.customer?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Assignee</dt>
                <dd className="mt-1 truncate font-medium">{assigneeName(ticket)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Updated</dt>
                <dd className="mt-1 font-medium">{ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Selected</dt>
                <dd className="mt-1">
                  <input
                    aria-label={`Select ticket ${ticket.ticket_number}`}
                    checked={selectedTicketIds.includes(ticket.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        onSelectedTicketIdsChange([...selectedTicketIds, ticket.id]);
                        return;
                      }

                      onSelectedTicketIdsChange(selectedTicketIds.filter((id) => id !== ticket.id));
                    }}
                    type="checkbox"
                  />
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <p className="mr-auto text-xs text-muted-foreground">
            Page {pagination.current_page} of {pagination.last_page} • {pagination.total} total
          </p>
          <Button
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            size="sm"
            type="button"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={page >= pagination.last_page}
            onClick={() => onPageChange(Math.min(pagination.last_page, page + 1))}
            size="sm"
            type="button"
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

function assigneeName(ticket: Ticket): string {
  return ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : 'Unassigned';
}
