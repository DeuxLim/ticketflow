import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MemberOption } from '@/features/workspace/api/ticketPageApi';
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
  members: MemberOption[];
  canManage: boolean;
  deletePending: boolean;
  assignmentPendingTicketId: number | null;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
  onAssign: (ticket: Ticket, assigneeId: number | null) => void;
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
  members,
  canManage,
  deletePending,
  assignmentPendingTicketId,
  onEdit,
  onDelete,
  onAssign,
}: TicketQueueTableProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tickets...</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6">
        <p className="text-sm font-medium">{hasActiveFilters ? 'No tickets match these filters.' : 'No tickets yet.'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasActiveFilters
            ? 'Reset search or filters to return to the full queue.'
            : 'Create the first ticket to start tracking support work.'}
        </p>
      </div>
    );
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
                  {canManage ? (
                    <Select
                      disabled={assignmentPendingTicketId === ticket.id}
                      onValueChange={(value) => onAssign(ticket, value === 'none' ? null : Number(value))}
                      value={ticket.assigned_to_user_id ? String(ticket.assigned_to_user_id) : 'none'}
                    >
                      <SelectTrigger aria-label={`Assign ${ticket.ticket_number}`} className="h-8 min-w-[180px]">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {ticket.assignee && !members.some((member) => member.user.id === ticket.assignee?.id) && (
                            <SelectItem value={String(ticket.assignee.id)}>
                              {ticket.assignee.first_name} {ticket.assignee.last_name}
                            </SelectItem>
                          )}
                          {members.map((member) => (
                            <SelectItem key={member.user.id} value={String(member.user.id)}>
                              {member.user.first_name} {member.user.last_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : 'Unassigned'}</span>
                  )}
                </TableCell>
                <TableCell><Badge variant="outline">{ticketStatusLabel(ticket.status)}</Badge></TableCell>
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
