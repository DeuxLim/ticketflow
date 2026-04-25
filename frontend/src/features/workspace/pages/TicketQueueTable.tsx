import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ApiPaginationMeta, Ticket } from '@/types/api';

type TicketQueueTableProps = {
  workspaceSlug?: string;
  tickets: Ticket[];
  isLoading: boolean;
  errorMessage: string | null;
  pagination?: ApiPaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  selectedTicketIds: number[];
  selectedVisibleTicketIds: number[];
  onSelectedTicketIdsChange: (ticketIds: number[]) => void;
  canManage: boolean;
  deletePending: boolean;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
};

export function TicketQueueTable({
  workspaceSlug,
  tickets,
  isLoading,
  errorMessage,
  pagination,
  page,
  onPageChange,
  selectedTicketIds,
  selectedVisibleTicketIds,
  onSelectedTicketIdsChange,
  canManage,
  deletePending,
  onEdit,
  onDelete,
}: TicketQueueTableProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tickets...</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }

  if (tickets.length === 0) {
    return <p className="text-sm text-muted-foreground">No tickets found for current filters.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
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
                  {ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : 'Unassigned'}
                </TableCell>
                <TableCell><Badge variant="outline">{ticket.status}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{ticket.priority}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      disabled={!canManage}
                      onClick={() => onEdit(ticket)}
                      size="sm"
                      variant="outline"
                      type="button"
                    >
                      Edit
                    </Button>
                    <Button
                      disabled={!canManage || deletePending}
                      onClick={() => onDelete(ticket)}
                      size="sm"
                      variant="outline"
                      type="button"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
