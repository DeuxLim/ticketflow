import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { ApiError } from '@/services/api/client';
import {
  bulkUpdateWorkspaceTickets,
  createWorkspaceTicket,
  deleteWorkspaceTicketById,
  listAssignableMembersForTickets,
  listTicketCustomersForSelectors,
  listWorkspaceTickets,
  updateWorkspaceTicketById,
} from '@/features/workspace/api/ticketPageApi';
import {
  createSavedView,
  deleteSavedView,
  listSavedViews,
  listTicketCategories,
  listTicketCustomFields,
  listTicketFormTemplates,
  listTicketQueues,
  listTicketTags,
} from '@/features/workspace/api/settings-api';
import { CreateTicketDialog, EditTicketDialog } from '@/features/workspace/pages/TicketFormDialogs';
import { TicketQueueControlsSheet } from '@/features/workspace/pages/TicketQueueControlsSheet';
import { TicketQueueSearchBar } from '@/features/workspace/pages/TicketQueueSearchBar';
import { TicketQueueTable } from '@/features/workspace/pages/TicketQueueTable';
import {
  applyTicketFormFieldErrors,
  buildCustomFieldPayload,
  filterCustomFieldsByTemplate,
  parseTicketTags,
  ticketFormSchema,
  type TicketForm,
} from '@/features/workspace/pages/ticketForm';
import {
  buildEditTicketFormValues,
  countActiveTicketFilters,
  createTicketFormDefaults,
  findSavedViewName,
} from '@/features/workspace/pages/ticketQueueHelpers';
import { selectorCoverageHint } from '@/features/workspace/utils/selectorCoverage';
import type { Ticket } from '@/types/api';

export function TicketsPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canView = accessQuery.can('tickets.view');
  const canManage = accessQuery.can('tickets.manage');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [queueFilter, setQueueFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [savedViewName, setSavedViewName] = useState('');
  const [savedViewShared, setSavedViewShared] = useState(false);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState<string>('none');
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const [createTemplateId, setCreateTemplateId] = useState<string>('none');
  const [editTemplateId, setEditTemplateId] = useState<string>('none');
  const [page, setPage] = useState(1);
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'none' | TicketForm['status']>('none');
  const [bulkPriority, setBulkPriority] = useState<'none' | TicketForm['priority']>('none');
  const [bulkAssignee, setBulkAssignee] = useState<string>('none');

  const createForm = useForm<TicketForm>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: createTicketFormDefaults(),
  });

  const editForm = useForm<TicketForm>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: createTicketFormDefaults(),
  });

  const customersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'customers', 'for-ticket'],
    queryFn: () => listTicketCustomersForSelectors(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const membersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'members', 'for-ticket'],
    queryFn: () => listAssignableMembersForTickets(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const ticketsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'tickets', search, statusFilter, priorityFilter, queueFilter, categoryFilter, customerFilter, assigneeFilter, page],
    queryFn: () => listWorkspaceTickets(workspaceSlug ?? '', {
      search,
      status: statusFilter,
      priority: priorityFilter,
      queueKey: queueFilter,
      category: categoryFilter,
      customerId: customerFilter,
      assigneeId: assigneeFilter,
      page,
    }),
    enabled: Boolean(workspaceSlug && canView),
  });

  const savedViewsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'saved-views'],
    queryFn: () => listSavedViews(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canView),
  });

  const queueConfigsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket-queues'],
    queryFn: () => listTicketQueues(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const categoryConfigsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket-categories'],
    queryFn: () => listTicketCategories(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const tagConfigsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket-tags'],
    queryFn: () => listTicketTags(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const customFieldConfigsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket-custom-fields'],
    queryFn: () => listTicketCustomFields(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const templateConfigsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket-form-templates'],
    queryFn: () => listTicketFormTemplates(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const activeQueueConfigs = useMemo(
    () =>
      (queueConfigsQuery.data?.data ?? [])
        .filter((queue) => queue.is_active)
        .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id),
    [queueConfigsQuery.data?.data],
  );

  const activeCategoryConfigs = useMemo(
    () =>
      (categoryConfigsQuery.data?.data ?? [])
        .filter((category) => category.is_active)
        .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id),
    [categoryConfigsQuery.data?.data],
  );

  const activeTagConfigs = useMemo(
    () =>
      (tagConfigsQuery.data?.data ?? [])
        .filter((tag) => tag.is_active)
        .sort((left, right) => left.name.localeCompare(right.name)),
    [tagConfigsQuery.data?.data],
  );

  const activeCustomFieldConfigs = useMemo(
    () =>
      (customFieldConfigsQuery.data?.data ?? [])
        .filter((field) => field.is_active)
        .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id),
    [customFieldConfigsQuery.data?.data],
  );

  const activeTemplateConfigs = useMemo(
    () =>
      (templateConfigsQuery.data?.data ?? [])
        .filter((template) => template.is_active)
        .sort((left, right) => Number(right.is_default) - Number(left.is_default) || left.id - right.id),
    [templateConfigsQuery.data?.data],
  );

  const defaultTemplateId = activeTemplateConfigs.length > 0 ? String(activeTemplateConfigs[0].id) : 'none';
  const createSelectedTemplate = activeTemplateConfigs.find((template) => String(template.id) === createTemplateId) ?? null;
  const editSelectedTemplate = activeTemplateConfigs.find((template) => String(template.id) === editTemplateId) ?? null;
  const createTemplateFields = filterCustomFieldsByTemplate(activeCustomFieldConfigs, createSelectedTemplate);
  const editTemplateFields = filterCustomFieldsByTemplate(activeCustomFieldConfigs, editSelectedTemplate);

  const createTicket = useMutation({
    mutationFn: (values: TicketForm) =>
      createWorkspaceTicket(workspaceSlug ?? '', {
        customer_id: Number(values.customer_id),
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigned_to_user_id: values.assigned_to_user_id ? Number(values.assigned_to_user_id) : null,
        category: values.category || null,
        queue_key: values.queue_key || null,
        tags: parseTicketTags(values.tags),
        custom_fields: buildCustomFieldPayload(values.custom_fields, createTemplateFields),
      }),
    onSuccess: () => {
      createForm.reset(createTicketFormDefaults());
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
    },
    onError: (error) => {
      applyTicketFormFieldErrors(createForm, error);
    },
  });

  const updateTicket = useMutation({
    mutationFn: ({ ticketId, values }: { ticketId: number; values: TicketForm }) =>
      updateWorkspaceTicketById(workspaceSlug ?? '', ticketId, {
        customer_id: Number(values.customer_id),
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigned_to_user_id: values.assigned_to_user_id ? Number(values.assigned_to_user_id) : null,
        category: values.category || null,
        queue_key: values.queue_key || null,
        tags: parseTicketTags(values.tags),
        custom_fields: buildCustomFieldPayload(values.custom_fields, editTemplateFields),
      }),
    onSuccess: () => {
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket'] });
    },
    onError: (error) => {
      applyTicketFormFieldErrors(editForm, error);
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

      return bulkUpdateWorkspaceTickets(workspaceSlug ?? '', payload);
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
    mutationFn: (ticketId: number) => deleteWorkspaceTicketById(workspaceSlug ?? '', ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket'] });
    },
  });

  const saveView = useMutation({
    mutationFn: () =>
      createSavedView(workspaceSlug ?? '', {
        name: savedViewName.trim(),
        is_shared: savedViewShared,
        filters: {
          search,
          status: statusFilter,
          priority: priorityFilter,
          queueKey: queueFilter,
          category: categoryFilter,
          customerId: customerFilter,
          assigneeId: assigneeFilter,
          page,
        },
      }),
    onSuccess: () => {
      setSavedViewName('');
      setSavedViewShared(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'saved-views'] });
    },
  });

  const removeSavedView = useMutation({
    mutationFn: (viewId: number) => deleteSavedView(workspaceSlug ?? '', viewId),
    onSuccess: () => {
      setSelectedSavedViewId('none');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'saved-views'] });
    },
  });

  const tickets = useMemo(() => ticketsQuery.data?.data ?? [], [ticketsQuery.data?.data]);
  const pagination = ticketsQuery.data?.meta;
  const ticketIds = new Set(tickets.map((ticket) => ticket.id));
  const selectedVisibleTicketIds = selectedTicketIds.filter((id) => ticketIds.has(id));
  const activeFilterCount = countActiveTicketFilters(search, [
    statusFilter,
    priorityFilter,
    queueFilter,
    categoryFilter,
    customerFilter,
    assigneeFilter,
  ]);

  const resetPageAndSelection = () => {
    setPage(1);
    setSelectedTicketIds([]);
  };

  const resetAllControls = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setQueueFilter('all');
    setCategoryFilter('all');
    setCustomerFilter('all');
    setAssigneeFilter('all');
    setSelectedSavedViewId('none');
    setSavedViewName('');
    setSavedViewShared(false);
    resetPageAndSelection();
  };

  const applySavedFilters = (filters: Record<string, unknown>) => {
    setSearch(typeof filters.search === 'string' ? filters.search : '');
    setStatusFilter(typeof filters.status === 'string' ? filters.status : 'all');
    setPriorityFilter(typeof filters.priority === 'string' ? filters.priority : 'all');
    setQueueFilter(typeof filters.queueKey === 'string' ? filters.queueKey : 'all');
    setCategoryFilter(typeof filters.category === 'string' ? filters.category : 'all');
    setCustomerFilter(typeof filters.customerId === 'string' ? filters.customerId : 'all');
    setAssigneeFilter(typeof filters.assigneeId === 'string' ? filters.assigneeId : 'all');
    setPage(typeof filters.page === 'number' && Number.isFinite(filters.page) ? Math.max(1, filters.page) : 1);
    setSelectedTicketIds([]);
  };

  const openEditTicket = (ticket: Ticket) => {
    setEditTarget(ticket);
    setEditTemplateId(defaultTemplateId);
    editForm.reset(buildEditTicketFormValues(ticket));
  };

  const requestDeleteTicket = (ticket: Ticket) => {
    const shouldDelete = window.confirm(`Delete ${ticket.ticket_number}? This cannot be undone.`);
    if (shouldDelete) {
      deleteTicket.mutate(ticket.id);
    }
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
  const customerMeta = customersQuery.data?.meta;
  const customerCoverageHint = selectorCoverageHint(customers.length, customerMeta?.total, 'customers');
  const members = membersQuery.data?.data ?? [];
  const savedViews = savedViewsQuery.data?.data ?? [];
  const canSaveView = savedViewName.trim().length > 0;
  const selectedSavedViewName = findSavedViewName(savedViews, selectedSavedViewId);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="secondary">Tickets</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Ticket Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Scan the queue first, then open focused controls for saved views, filtering, and bulk updates when you need them.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsControlsOpen(true)} type="button" variant="outline">
            {selectedVisibleTicketIds.length > 0
              ? `Views & Filters (${selectedVisibleTicketIds.length} selected)`
              : activeFilterCount > 0
                ? `Views & Filters (${activeFilterCount})`
                : 'Views & Filters'}
          </Button>
          <Button
            disabled={!canManage}
            onClick={() => {
              setCreateTemplateId(defaultTemplateId);
              setIsCreateOpen(true);
            }}
            type="button"
          >
            Create Ticket
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Ticket List</CardTitle>
          <CardDescription>Keep the queue readable by leaving search inline and moving heavier control work into a dedicated panel.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          <TicketQueueSearchBar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              resetPageAndSelection();
            }}
            savedViewName={selectedSavedViewName}
            activeFilterCount={activeFilterCount}
            selectedVisibleTicketIdsCount={selectedVisibleTicketIds.length}
            onResetControls={resetAllControls}
          />

          <TicketQueueTable
            workspaceSlug={workspaceSlug}
            tickets={tickets}
            isLoading={ticketsQuery.isLoading}
            errorMessage={ticketsQuery.isError ? (ticketsQuery.error as Error).message : null}
            pagination={pagination}
            page={page}
            onPageChange={setPage}
            selectedTicketIds={selectedTicketIds}
            selectedVisibleTicketIds={selectedVisibleTicketIds}
            onSelectedTicketIdsChange={setSelectedTicketIds}
            canManage={canManage}
            deletePending={deleteTicket.isPending}
            onEdit={openEditTicket}
            onDelete={requestDeleteTicket}
          />
        </CardContent>
      </Card>

      <TicketQueueControlsSheet
        open={isControlsOpen}
        onOpenChange={setIsControlsOpen}
        selectedSavedViewId={selectedSavedViewId}
        onSelectedSavedViewIdChange={setSelectedSavedViewId}
        savedViews={savedViews}
        applySavedFilters={applySavedFilters}
        savedViewName={savedViewName}
        onSavedViewNameChange={setSavedViewName}
        savedViewShared={savedViewShared}
        onSavedViewSharedChange={setSavedViewShared}
        canSaveView={canSaveView}
        canManage={canManage}
        saveViewPending={saveView.isPending}
        onSaveView={() => saveView.mutate()}
        removeSavedViewPending={removeSavedView.isPending}
        onRemoveSavedView={(viewId) => removeSavedView.mutate(viewId)}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          resetPageAndSelection();
        }}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={(value) => {
          setPriorityFilter(value);
          resetPageAndSelection();
        }}
        queueFilter={queueFilter}
        onQueueFilterChange={(value) => {
          setQueueFilter(value);
          resetPageAndSelection();
        }}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(value) => {
          setCategoryFilter(value);
          resetPageAndSelection();
        }}
        customerFilter={customerFilter}
        onCustomerFilterChange={(value) => {
          setCustomerFilter(value);
          resetPageAndSelection();
        }}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={(value) => {
          setAssigneeFilter(value);
          resetPageAndSelection();
        }}
        activeQueueConfigs={activeQueueConfigs}
        activeCategoryConfigs={activeCategoryConfigs}
        customers={customers}
        customerCoverageHint={customerCoverageHint}
        members={members}
        bulkStatus={bulkStatus}
        onBulkStatusChange={setBulkStatus}
        bulkPriority={bulkPriority}
        onBulkPriorityChange={setBulkPriority}
        bulkAssignee={bulkAssignee}
        onBulkAssigneeChange={setBulkAssignee}
        selectedVisibleTicketIdsCount={selectedVisibleTicketIds.length}
        bulkUpdatePending={bulkUpdateTickets.isPending}
        onBulkApply={() => bulkUpdateTickets.mutate()}
        onResetControls={resetAllControls}
      />

      <CreateTicketDialog
        activeCategories={activeCategoryConfigs}
        activeCustomFields={createTemplateFields}
        activeQueues={activeQueueConfigs}
        activeTags={activeTagConfigs}
        customers={customers}
        errorMessage={createTicket.isError ? (createTicket.error as Error).message : null}
        form={createForm}
        isPending={createTicket.isPending}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCreateTemplateId(defaultTemplateId);
            createForm.reset(createTicketFormDefaults());
          }
        }}
        open={isCreateOpen}
        members={members}
        onSubmit={(values) => createTicket.mutate(values)}
        onTemplateChange={setCreateTemplateId}
        selectedTemplateId={createTemplateId}
        templates={activeTemplateConfigs}
      />

      <EditTicketDialog
        activeCategories={activeCategoryConfigs}
        activeCustomFields={editTemplateFields}
        activeQueues={activeQueueConfigs}
        activeTags={activeTagConfigs}
        customers={customers}
        errorMessage={updateTicket.isError ? (updateTicket.error as Error).message : null}
        form={editForm}
        isPending={updateTicket.isPending}
        members={members}
        onCancel={() => setEditTarget(null)}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditTemplateId(defaultTemplateId);
          }
        }}
        onSubmit={(values) => {
          if (editTarget) {
            updateTicket.mutate({ ticketId: editTarget.id, values });
          }
        }}
        onTemplateChange={setEditTemplateId}
        open={Boolean(editTarget)}
        selectedTemplateId={editTemplateId}
        submitDisabled={updateTicket.isPending || editForm.formState.isSubmitting || !editTarget}
        templates={activeTemplateConfigs}
      />
    </section>
  );
}
