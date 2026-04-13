import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { Input } from '@/components/ui/input';
import { ApiError, apiRequest } from '@/services/api/client';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { ApiPaginationMeta, Customer, Ticket } from '@/types/api';

const ticketSchema = z.object({
  customer_id: z.string().min(1, 'Select a customer'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to_user_id: z.string().optional().or(z.literal('')),
});

type TicketForm = z.infer<typeof ticketSchema>;

type MemberOption = {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
};

export function TicketsPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canView = accessQuery.can('tickets.view');
  const canManage = accessQuery.can('tickets.manage');
  const canManageMembers = accessQuery.can('members.manage');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const [page, setPage] = useState(1);
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'none' | TicketForm['status']>('none');
  const [bulkPriority, setBulkPriority] = useState<'none' | TicketForm['priority']>('none');
  const [bulkAssignee, setBulkAssignee] = useState<string>('none');

  const createForm = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      customer_id: '',
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      assigned_to_user_id: '',
    },
  });

  const editForm = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      customer_id: '',
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      assigned_to_user_id: '',
    },
  });

  const customersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'customers', 'for-ticket'],
    queryFn: () => apiRequest<{ data: Customer[] }>(`/workspaces/${workspaceSlug}/customers`),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const membersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'members', 'for-ticket'],
    queryFn: () => apiRequest<{ data: MemberOption[] }>(`/workspaces/${workspaceSlug}/members`),
    enabled: Boolean(workspaceSlug && canManage && canManageMembers),
  });

  const ticketsPath = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    if (customerFilter !== 'all') params.set('customer_id', customerFilter);
    if (assigneeFilter !== 'all') params.set('assignee_id', assigneeFilter);
    params.set('page', String(page));

    const suffix = params.toString();
    return suffix ? `/workspaces/${workspaceSlug}/tickets?${suffix}` : `/workspaces/${workspaceSlug}/tickets`;
  }, [workspaceSlug, search, statusFilter, priorityFilter, customerFilter, assigneeFilter, page]);

  const ticketsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'tickets', search, statusFilter, priorityFilter, customerFilter, assigneeFilter, page],
    queryFn: () => apiRequest<{ data: Ticket[]; meta: ApiPaginationMeta }>(ticketsPath),
    enabled: Boolean(workspaceSlug && canView),
  });

  const createTicket = useMutation({
    mutationFn: (values: TicketForm) =>
      apiRequest(`/workspaces/${workspaceSlug}/tickets`, {
        method: 'POST',
        body: JSON.stringify({
          customer_id: Number(values.customer_id),
          title: values.title,
          description: values.description,
          status: values.status,
          priority: values.priority,
          assigned_to_user_id: values.assigned_to_user_id ? Number(values.assigned_to_user_id) : null,
        }),
      }),
    onSuccess: () => {
      createForm.reset({
        customer_id: '',
        title: '',
        description: '',
        status: 'open',
        priority: 'medium',
        assigned_to_user_id: '',
      });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
    },
  });

  const updateTicket = useMutation({
    mutationFn: ({ ticketId, values }: { ticketId: number; values: TicketForm }) =>
      apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customer_id: Number(values.customer_id),
          title: values.title,
          description: values.description,
          status: values.status,
          priority: values.priority,
          assigned_to_user_id: values.assigned_to_user_id ? Number(values.assigned_to_user_id) : null,
        }),
      }),
    onSuccess: () => {
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket'] });
    },
  });

  const bulkUpdateTickets = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        ticket_ids: selectedVisibleTicketIds,
      };

      if (bulkStatus !== 'none') payload.status = bulkStatus;
      if (bulkPriority !== 'none') payload.priority = bulkPriority;
      if (bulkAssignee !== 'none') payload.assigned_to_user_id = bulkAssignee === '' ? null : Number(bulkAssignee);

      return apiRequest(`/workspaces/${workspaceSlug}/tickets/bulk`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setSelectedTicketIds([]);
      setBulkStatus('none');
      setBulkPriority('none');
      setBulkAssignee('none');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: (ticketId: number) =>
      apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket'] });
    },
  });

  const tickets = useMemo(() => ticketsQuery.data?.data ?? [], [ticketsQuery.data?.data]);
  const pagination = ticketsQuery.data?.meta;
  const ticketIds = new Set(tickets.map((ticket) => ticket.id));
  const selectedVisibleTicketIds = selectedTicketIds.filter((id) => ticketIds.has(id));

  const resetPageAndSelection = () => {
    setPage(1);
    setSelectedTicketIds([]);
  };

  if (accessQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Checking access...</p>;
  }

  if (!canView) {
    return (
      <ForbiddenState
        title="Tickets unavailable"
        description="You need the tickets.view permission to access ticket queues in this workspace."
      />
    );
  }

  if (ticketsQuery.isError && ticketsQuery.error instanceof ApiError && ticketsQuery.error.status === 403) {
    return (
      <ForbiddenState
        title="Tickets unavailable"
        description="Your role can no longer access ticket queues for this workspace."
      />
    );
  }

  const customers = customersQuery.data?.data ?? [];
  const members = membersQuery.data?.data ?? [];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="secondary">Tickets</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Ticket Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Full ticket lifecycle management with assignment and status controls.</p>
        </div>
        <Button disabled={!canManage} onClick={() => setIsCreateOpen(true)} type="button">
          Create Ticket
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Ticket List</CardTitle>
          <CardDescription>{tickets.length} records</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="grid gap-3 md:grid-cols-6">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="ticket-search">Search</FieldLabel>
              <Input
                id="ticket-search"
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPageAndSelection();
                }}
                placeholder="Ticket number, title, or description…"
                value={search}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="status-filter">Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value ?? 'all');
                resetPageAndSelection();
              }}>
                <SelectTrigger className="w-full" id="status-filter"><SelectValue placeholder="All status" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="priority-filter">Priority</FieldLabel>
              <Select value={priorityFilter} onValueChange={(value) => {
                setPriorityFilter(value ?? 'all');
                resetPageAndSelection();
              }}>
                <SelectTrigger className="w-full" id="priority-filter"><SelectValue placeholder="All priority" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="customer-filter">Customer</FieldLabel>
              <Select value={customerFilter} onValueChange={(value) => {
                setCustomerFilter(value ?? 'all');
                resetPageAndSelection();
              }}>
                <SelectTrigger className="w-full" id="customer-filter"><SelectValue placeholder="All customers" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All customers</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="assignee-filter">Assignee</FieldLabel>
              <Select value={assigneeFilter} onValueChange={(value) => {
                setAssigneeFilter(value ?? 'all');
                resetPageAndSelection();
              }}>
                <SelectTrigger className="w-full" id="assignee-filter"><SelectValue placeholder="All assignees" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All assignees</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.user.id} value={String(member.user.id)}>
                        {member.user.first_name} {member.user.last_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCustomerFilter('all');
                setAssigneeFilter('all');
                setPage(1);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Reset filters
            </Button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select value={bulkStatus} onValueChange={(value) => setBulkStatus((value ?? 'none') as 'none' | TicketForm['status'])}>
                <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Bulk status" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Keep status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={bulkPriority} onValueChange={(value) => setBulkPriority((value ?? 'none') as 'none' | TicketForm['priority'])}>
                <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Bulk priority" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Keep priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={bulkAssignee} onValueChange={(value) => setBulkAssignee(value ?? 'none')}>
                <SelectTrigger className="h-8 w-[180px]"><SelectValue placeholder="Bulk assignee" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Keep assignee</SelectItem>
                    <SelectItem value="">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.user.id} value={String(member.user.id)}>
                        {member.user.first_name} {member.user.last_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                disabled={
                  !canManage ||
                  selectedVisibleTicketIds.length === 0 ||
                  (bulkStatus === 'none' && bulkPriority === 'none' && bulkAssignee === 'none') ||
                  bulkUpdateTickets.isPending
                }
                onClick={() => bulkUpdateTickets.mutate()}
                size="sm"
                type="button"
              >
                {bulkUpdateTickets.isPending ? 'Applying...' : `Apply to ${selectedVisibleTicketIds.length}`}
              </Button>
            </div>
          </div>

          {ticketsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading tickets...</p>
          ) : ticketsQuery.isError ? (
            <p className="text-sm text-destructive">{(ticketsQuery.error as Error).message}</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets found for current filters.</p>
          ) : (
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
                          setSelectedTicketIds(tickets.map((ticket) => ticket.id));
                          return;
                        }

                        setSelectedTicketIds([]);
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
                            setSelectedTicketIds((prev) => [...prev, ticket.id]);
                            return;
                          }

                          setSelectedTicketIds((prev) => prev.filter((id) => id !== ticket.id));
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
                          onClick={() => {
                            setEditTarget(ticket);
                            editForm.reset({
                              customer_id: String(ticket.customer_id),
                              title: ticket.title,
                              description: ticket.description,
                              status: ticket.status,
                              priority: ticket.priority,
                              assigned_to_user_id: ticket.assigned_to_user_id ? String(ticket.assigned_to_user_id) : '',
                            });
                          }}
                          size="sm"
                          variant="outline"
                          type="button"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={!canManage || deleteTicket.isPending}
                          onClick={() => {
                            const shouldDelete = window.confirm(`Delete ${ticket.ticket_number}? This cannot be undone.`);
                            if (shouldDelete) {
                              deleteTicket.mutate(ticket.id);
                            }
                          }}
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
          )}

          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <p className="mr-auto text-xs text-muted-foreground">
                Page {pagination.current_page} of {pagination.last_page} • {pagination.total} total
              </p>
              <Button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={page >= pagination.last_page}
                onClick={() => setPage((prev) => Math.min(pagination.last_page, prev + 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            createForm.reset({
              customer_id: '',
              title: '',
              description: '',
              status: 'open',
              priority: 'medium',
              assigned_to_user_id: '',
            });
          }
        }}
        open={isCreateOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Ticket</DialogTitle>
            <DialogDescription>Create a ticket with status, priority, and assignee details.</DialogDescription>
          </DialogHeader>
          <TicketFormFields
            customers={customers}
            form={createForm}
            formId="create-ticket-form"
            members={members}
            onSubmit={(values) => createTicket.mutate(values)}
          />
          {createTicket.isError && <p className="text-xs text-destructive">{(createTicket.error as Error).message}</p>}
          <DialogFooter>
            <Button onClick={() => setIsCreateOpen(false)} type="button" variant="outline">Cancel</Button>
            <Button disabled={createForm.formState.isSubmitting || createTicket.isPending} form="create-ticket-form" type="submit">
              {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        open={Boolean(editTarget)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>Update customer, assignee, status, priority, and details.</DialogDescription>
          </DialogHeader>
          <TicketFormFields
            customers={customers}
            form={editForm}
            formId="edit-ticket-form"
            members={members}
            onSubmit={(values) => {
              if (editTarget) {
                updateTicket.mutate({ ticketId: editTarget.id, values });
              }
            }}
          />
          {updateTicket.isError && <p className="text-xs text-destructive">{(updateTicket.error as Error).message}</p>}
          <DialogFooter>
            <Button onClick={() => setEditTarget(null)} type="button" variant="outline">Cancel</Button>
            <Button disabled={updateTicket.isPending || editForm.formState.isSubmitting || !editTarget} form="edit-ticket-form" type="submit">
              {updateTicket.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function TicketFormFields({
  form,
  customers,
  members,
  onSubmit,
  formId,
}: {
  form: UseFormReturn<TicketForm>;
  customers: Customer[];
  members: MemberOption[];
  onSubmit: (values: TicketForm) => void;
  formId: string;
}) {
  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="grid gap-4 md:grid-cols-2">
      <Field data-invalid={Boolean(form.formState.errors.customer_id)}>
        <FieldLabel htmlFor={`${formId}-customer`}>Customer</FieldLabel>
        <Select
          onValueChange={(value) => form.setValue('customer_id', value ?? '', { shouldValidate: true })}
          value={form.watch('customer_id')}
        >
          <SelectTrigger id={`${formId}-customer`} aria-invalid={Boolean(form.formState.errors.customer_id)}>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldError errors={[form.formState.errors.customer_id]} />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${formId}-assignee`}>Assignee</FieldLabel>
        <Select
          onValueChange={(value) => form.setValue('assigned_to_user_id', value === 'none' || value === null ? '' : value)}
          value={form.watch('assigned_to_user_id') || 'none'}
        >
          <SelectTrigger id={`${formId}-assignee`}><SelectValue placeholder="Unassigned" /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="none">Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.user.id} value={String(member.user.id)}>
                  {member.user.first_name} {member.user.last_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.title)}>
        <FieldLabel htmlFor={`${formId}-title`}>Title</FieldLabel>
        <Input id={`${formId}-title`} aria-invalid={Boolean(form.formState.errors.title)} {...form.register('title')} />
        <FieldError errors={[form.formState.errors.title]} />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${formId}-status`}>Status</FieldLabel>
        <Select
          onValueChange={(value) => form.setValue('status', value as TicketForm['status'])}
          value={form.watch('status')}
        >
          <SelectTrigger id={`${formId}-status`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.description)} className="md:col-span-2">
        <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
        <Textarea id={`${formId}-description`} aria-invalid={Boolean(form.formState.errors.description)} {...form.register('description')} />
        <FieldError errors={[form.formState.errors.description]} />
      </Field>

      <Field className="md:col-span-2">
        <FieldLabel htmlFor={`${formId}-priority`}>Priority</FieldLabel>
        <Select
          onValueChange={(value) => form.setValue('priority', value as TicketForm['priority'])}
          value={form.watch('priority')}
        >
          <SelectTrigger id={`${formId}-priority`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      </FieldGroup>
    </form>
  );
}
