import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  addWorkspaceTicketWatcher,
  createWorkspaceChecklistItem,
  createWorkspaceRelatedTicket,
  createWorkspaceTicketComment,
  deleteWorkspaceChecklistItem,
  deleteWorkspaceRelatedTicket,
  deleteWorkspaceTicket,
  deleteWorkspaceTicketAttachment,
  deleteWorkspaceTicketComment,
  getWorkspaceTicket,
  listWorkspaceTicketActivity,
  listWorkspaceTicketAttachments,
  listWorkspaceTicketComments,
  reorderWorkspaceChecklistItems,
  removeWorkspaceTicketWatcher,
  transitionWorkspaceTicket,
  updateWorkspaceChecklistItem,
  updateWorkspaceTicketComment,
  updateWorkspaceTicket,
  uploadWorkspaceTicketAttachment,
} from '@/features/workspace/pages/ticketDetailsApi';
import { TicketDetailsEditSheet } from '@/features/workspace/pages/TicketDetailsEditSheet';
import { TicketDetailsSupportDialogs } from '@/features/workspace/pages/TicketDetailsSupportDialogs';
import {
  buildTicketDetailsFormValues,
  bytesToReadable,
  checklistSchema,
  commentSchema,
  createTicketDetailsFormDefaults,
  formatTicketDetailsDate,
  relatedTicketSchema,
  statusLabel,
  type ActivityLog,
  type ChecklistForm,
  type CommentForm,
  type RelatedTicketForm,
  type TicketDetailsAttachment,
} from '@/features/workspace/pages/ticketDetailsHelpers';
import { listAssignableMembersForTickets, listRelatedTicketOptions, listTicketCustomersForSelectors } from '@/features/workspace/pages/ticketPageApi';
import {
  applyTicketFormFieldErrors,
  buildCustomFieldPayload,
  filterCustomFieldsByTemplate,
  parseTicketTags,
  ticketFormSchema,
  type TicketForm,
} from '@/features/workspace/pages/ticketForm';
import { listTicketCategories, listTicketCustomFields, listTicketFormTemplates, listTicketQueues, listTicketTags } from '@/features/workspace/settings/settings-api';
import { selectorCoverageHint } from '@/features/workspace/utils/selectorCoverage';
import { ApiError, apiDownload, apiRequest } from '@/services/api/client';
import type { Ticket, TicketChecklistItem, TicketComment, TicketCustomFieldValue } from '@/types/api';

type AuthUser = {
  id: number;
  email: string;
  is_platform_admin: boolean;
};

function fullName(person?: { first_name?: string; last_name?: string } | null): string {
  if (!person) return '—';
  return `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() || '—';
}

function nextStatuses(current: Ticket['status']): Ticket['status'][] {
  const map: Record<Ticket['status'], Ticket['status'][]> = {
    open: ['in_progress', 'closed'],
    in_progress: ['resolved', 'closed'],
    resolved: ['closed', 'in_progress'],
    closed: ['in_progress'],
  };

  return map[current] ?? [];
}

function humanizeAction(action: string): string {
  return action.replaceAll('.', ' ').replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function customFieldValue(value: TicketCustomFieldValue['value']): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function TicketDetailsPage() {
  const { workspaceSlug, ticketId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isWatchersOpen, setIsWatchersOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string>('none');
  const [isRelatedOpen, setIsRelatedOpen] = useState(false);
  const [quickActionMessage, setQuickActionMessage] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canView = accessQuery.can('tickets.view');
  const canComment = accessQuery.can('tickets.comment');
  const canManage = accessQuery.can('tickets.manage');

  const commentForm = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: '', is_internal: false },
  });

  const editForm = useForm<TicketForm>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: createTicketDetailsFormDefaults(),
  });

  const checklistForm = useForm<ChecklistForm>({
    resolver: zodResolver(checklistSchema),
    defaultValues: { title: '' },
  });

  const relatedTicketForm = useForm<RelatedTicketForm>({
    resolver: zodResolver(relatedTicketSchema),
    defaultValues: { related_ticket_id: '', relationship_type: 'related' },
  });
  const editCustomerIdValue = useWatch({ control: editForm.control, name: 'customer_id' });
  const editAssigneeIdValue = useWatch({ control: editForm.control, name: 'assigned_to_user_id' });
  const editStatusValue = useWatch({ control: editForm.control, name: 'status' });
  const editPriorityValue = useWatch({ control: editForm.control, name: 'priority' });
  const editCustomFieldsValue = useWatch({ control: editForm.control, name: 'custom_fields' });
  const relatedTicketIdValue = useWatch({ control: relatedTicketForm.control, name: 'related_ticket_id' });
  const relatedTicketRelationshipValue = useWatch({ control: relatedTicketForm.control, name: 'relationship_type' });

  const ticketQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket', ticketId],
    queryFn: () => getWorkspaceTicket(workspaceSlug ?? '', ticketId ?? ''),
    enabled: Boolean(workspaceSlug && ticketId && canView),
  });

  const customersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'customers', 'for-ticket-details'],
    queryFn: () => listTicketCustomersForSelectors(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const membersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'members', 'for-ticket-details'],
    queryFn: () => listAssignableMembersForTickets(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
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

  const relatedTicketOptionsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'tickets', 'related-options'],
    queryFn: () => listRelatedTicketOptions(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const commentsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'comments'],
    queryFn: () => listWorkspaceTicketComments(workspaceSlug ?? '', ticketId ?? '') as Promise<{ data: TicketComment[] }>,
    enabled: Boolean(workspaceSlug && ticketId && canView),
  });

  const activityQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'],
    queryFn: () => listWorkspaceTicketActivity(workspaceSlug ?? '', ticketId ?? '') as Promise<{ data: ActivityLog[] }>,
    enabled: Boolean(workspaceSlug && ticketId && canView),
  });

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<{ data: AuthUser }>('/auth/me'),
    staleTime: 60_000,
  });

  const attachmentsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'attachments'],
    queryFn: () => listWorkspaceTicketAttachments(workspaceSlug ?? '', ticketId ?? '') as Promise<{ data: TicketDetailsAttachment[] }>,
    enabled: Boolean(workspaceSlug && ticketId && canView),
  });

  const addComment = useMutation({
    mutationFn: async (values: CommentForm) => {
      const response = await createWorkspaceTicketComment(workspaceSlug ?? '', ticketId ?? '', values) as { data: TicketComment };

      const commentId = response.data.id;

      for (const file of commentFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('comment_id', String(commentId));

        await uploadWorkspaceTicketAttachment(workspaceSlug ?? '', ticketId ?? '', formData);
      }

      return response;
    },
    onSuccess: () => {
      commentForm.reset({ body: '', is_internal: false });
      setCommentFiles([]);
      setIsCommentOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'attachments'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
    },
  });

  const updateComment = useMutation({
    mutationFn: ({ commentId, body }: { commentId: number; body: string }) =>
      updateWorkspaceTicketComment(workspaceSlug ?? '', ticketId ?? '', commentId, { body }),
    onSuccess: () => {
      setEditingCommentId(null);
      setEditingCommentBody('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: number) =>
      deleteWorkspaceTicketComment(workspaceSlug ?? '', ticketId ?? '', commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'attachments'] });
    },
  });

  const updateTicket = useMutation({
    mutationFn: (values: TicketForm) =>
      updateWorkspaceTicket(workspaceSlug ?? '', ticketId ?? '', {
        customer_id: Number(values.customer_id),
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigned_to_user_id: values.assigned_to_user_id ? Number(values.assigned_to_user_id) : null,
        category: values.category || null,
        queue_key: values.queue_key || null,
        tags: parseTicketTags(values.tags),
        custom_fields: buildCustomFieldPayload(values.custom_fields, scopedCustomFieldConfigs),
      }),
    onSuccess: () => {
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
    onError: (error) => {
      applyTicketFormFieldErrors(editForm, error);
    },
  });

  const quickTransition = useMutation({
    mutationFn: async (status: Ticket['status']) => {
      try {
        return await transitionWorkspaceTicket(workspaceSlug ?? '', ticketId ?? '', status);
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          return updateWorkspaceTicket(workspaceSlug ?? '', ticketId ?? '', { status }) as Promise<{ data: Ticket }>;
        }
        throw error;
      }
    },
    onSuccess: (payload) => {
      if ((payload as { message?: string }).message) {
        setQuickActionMessage((payload as { message?: string }).message ?? null);
      } else {
        setQuickActionMessage(null);
      }
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
    },
  });

  const uploadAttachment = useMutation({
    mutationFn: () => {
      if (!attachmentFile) throw new Error('Please select a file first.');
      const formData = new FormData();
      formData.append('file', attachmentFile);

      return uploadWorkspaceTicketAttachment(workspaceSlug ?? '', ticketId ?? '', formData);
    },
    onSuccess: () => {
      setAttachmentFile(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'attachments'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: number) => deleteWorkspaceTicketAttachment(workspaceSlug ?? '', ticketId ?? '', attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'attachments'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const addWatcher = useMutation({
    mutationFn: () => addWorkspaceTicketWatcher(workspaceSlug ?? '', ticketId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const removeWatcher = useMutation({
    mutationFn: (watcherId: number) => removeWorkspaceTicketWatcher(workspaceSlug ?? '', ticketId ?? '', watcherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const addChecklistItem = useMutation({
    mutationFn: (values: ChecklistForm) =>
      createWorkspaceChecklistItem(workspaceSlug ?? '', ticketId ?? '', { title: values.title }),
    onSuccess: () => {
      checklistForm.reset({ title: '' });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const updateChecklistItem = useMutation({
    mutationFn: ({ itemId, values }: { itemId: number; values: Partial<TicketChecklistItem> }) =>
      updateWorkspaceChecklistItem(workspaceSlug ?? '', ticketId ?? '', itemId, values as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const deleteChecklistItem = useMutation({
    mutationFn: (itemId: number) => deleteWorkspaceChecklistItem(workspaceSlug ?? '', ticketId ?? '', itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const reorderChecklistItems = useMutation({
    mutationFn: (items: Array<{ id: number; sort_order: number }>) =>
      reorderWorkspaceChecklistItems(workspaceSlug ?? '', ticketId ?? '', items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const addRelatedTicket = useMutation({
    mutationFn: (values: RelatedTicketForm) =>
      createWorkspaceRelatedTicket(workspaceSlug ?? '', ticketId ?? '', {
        related_ticket_id: Number(values.related_ticket_id),
        relationship_type: values.relationship_type,
      }),
    onSuccess: () => {
      relatedTicketForm.reset({ related_ticket_id: '', relationship_type: 'related' });
      setIsRelatedOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const deleteRelatedTicket = useMutation({
    mutationFn: (linkId: number) => deleteWorkspaceRelatedTicket(workspaceSlug ?? '', ticketId ?? '', linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: () => deleteWorkspaceTicket(workspaceSlug ?? '', ticketId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
      navigate(`/workspaces/${workspaceSlug}/tickets`);
    },
  });

  const ticket = ticketQuery.data?.data;
  const customers = customersQuery.data?.data ?? [];
  const customersMeta = customersQuery.data?.meta;
  const members = membersQuery.data?.data ?? [];
  const activeQueueConfigs = (queueConfigsQuery.data?.data ?? [])
    .filter((queue) => queue.is_active)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  const activeCategoryConfigs = (categoryConfigsQuery.data?.data ?? [])
    .filter((category) => category.is_active)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  const activeTagConfigs = (tagConfigsQuery.data?.data ?? [])
    .filter((tag) => tag.is_active)
    .sort((left, right) => left.name.localeCompare(right.name));
  const activeCustomFieldConfigs = (customFieldConfigsQuery.data?.data ?? [])
    .filter((field) => field.is_active)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  const activeTemplateConfigs = (templateConfigsQuery.data?.data ?? [])
    .filter((template) => template.is_active)
    .sort((left, right) => Number(right.is_default) - Number(left.is_default) || left.id - right.id);
  const defaultTemplateId = activeTemplateConfigs.length > 0 ? String(activeTemplateConfigs[0].id) : 'none';
  const effectiveEditTemplateId = editTemplateId === 'none' && defaultTemplateId !== 'none' ? defaultTemplateId : editTemplateId;
  const selectedTemplate = activeTemplateConfigs.find((template) => String(template.id) === effectiveEditTemplateId) ?? null;
  const scopedCustomFieldConfigs = filterCustomFieldsByTemplate(activeCustomFieldConfigs, selectedTemplate);
  const relatedTicketOptions = (relatedTicketOptionsQuery.data?.data ?? []).filter((option) => String(option.id) !== ticketId);
  const relatedTicketsMeta = relatedTicketOptionsQuery.data?.meta;
  const relatedTicketsCoverageHint = selectorCoverageHint(relatedTicketOptions.length, relatedTicketsMeta?.total, 'tickets');
  const customersCoverageHint = selectorCoverageHint(customers.length, customersMeta?.total, 'customers');
  const attachments = useMemo(() => attachmentsQuery.data?.data ?? [], [attachmentsQuery.data?.data]);
  const activityLogs = useMemo(() => activityQuery.data?.data ?? [], [activityQuery.data?.data]);
  const watchers = ticket?.watchers ?? [];
  const checklistItems = ticket?.checklist_items ?? [];
  const relatedTickets = ticket?.related_tickets ?? [];
  const customFields = ticket?.custom_fields ?? [];
  const stateSummary = ticket?.state_summary;
  const currentUserId = meQuery.data?.data.id;
  const ticketLevelAttachments = attachments.filter((attachment) => attachment.comment_id === null);
  const selfWatcher = watchers.find((watcher) => watcher.user_id === currentUserId);
  const editQueueValue = useWatch({ control: editForm.control, name: 'queue_key' }) || 'none';
  const editCategoryValue = useWatch({ control: editForm.control, name: 'category' }) || 'none';
  const hasLegacyEditQueueValue = editQueueValue !== 'none' && !activeQueueConfigs.some((queue) => queue.key === editQueueValue);
  const hasLegacyEditCategoryValue = editCategoryValue !== 'none' && !activeCategoryConfigs.some((category) => category.key === editCategoryValue);
  const watcherMutationError = addWatcher.error ?? removeWatcher.error;
  const checklistMutationError = addChecklistItem.error ?? updateChecklistItem.error ?? deleteChecklistItem.error ?? reorderChecklistItems.error;
  const relatedTicketMutationError = addRelatedTicket.error ?? deleteRelatedTicket.error;
  const attachmentsByComment = useMemo(() => {
    return attachments.reduce<Record<number, TicketDetailsAttachment[]>>((acc, attachment) => {
      if (attachment.comment_id === null) {
        return acc;
      }

      if (!acc[attachment.comment_id]) {
        acc[attachment.comment_id] = [];
      }

      acc[attachment.comment_id].push(attachment);
      return acc;
    }, {});
  }, [attachments]);

  const moveChecklistItem = (itemId: number, direction: 'up' | 'down') => {
    const index = checklistItems.findIndex((item) => item.id === itemId);
    if (index < 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= checklistItems.length) return;

    const reordered = [...checklistItems];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    reorderChecklistItems.mutate(
      reordered.map((item, sortIndex) => ({
        id: item.id,
        sort_order: sortIndex,
      })),
    );
  };

  const slaSignals = useMemo(() => {
    if (!ticket) return [] as Array<{ key: string; label: string; time: string | null; severity: 'warning' | 'info' }>;

    const now = new Date();
    const signals: Array<{ key: string; label: string; time: string | null; severity: 'warning' | 'info' }> = [];

    if (ticket.first_response_due_at && !ticket.first_responded_at && new Date(ticket.first_response_due_at) < now) {
      signals.push({
        key: 'first-response-breach',
        label: 'First response SLA breached',
        time: ticket.first_response_due_at,
        severity: 'warning',
      });
    }

    if (ticket.resolution_due_at && !ticket.resolved_at && new Date(ticket.resolution_due_at) < now) {
      signals.push({
        key: 'resolution-breach',
        label: 'Resolution SLA breached',
        time: ticket.resolution_due_at,
        severity: 'warning',
      });
    }

    if (signals.length === 0) {
      signals.push({
        key: 'sla-healthy',
        label: 'No active SLA breaches',
        time: null,
        severity: 'info',
      });
    }

    return signals;
  }, [ticket]);

  useEffect(() => {
    if (!ticket) return;

    const activeConfigsForReset = (customFieldConfigsQuery.data?.data ?? []).filter((field) => field.is_active);
    editForm.reset(buildTicketDetailsFormValues(ticket, activeConfigsForReset));
  }, [ticket, customFieldConfigsQuery.data?.data, editForm]);

  if (accessQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Checking access...</p>;
  }

  if (!canView) {
    return (
      <ForbiddenState
        title="Ticket details unavailable"
        description="You need the tickets.view permission to open ticket threads."
      />
    );
  }

  if (ticketQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading ticket...</p>;
  }

  if (ticketQuery.isError && ticketQuery.error instanceof ApiError && ticketQuery.error.status === 403) {
    return (
      <ForbiddenState
        title="Ticket details unavailable"
        description="Your role can no longer access this ticket in the current workspace."
      />
    );
  }

  if (ticketQuery.isError || !ticket) {
    return <p className="text-sm text-destructive">Unable to load ticket.</p>;
  }

  return (
    <section className="flex flex-col gap-6">
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
              disabled={!canManage || quickTransition.isPending}
              onClick={() => quickTransition.mutate(next)}
              size="sm"
              type="button"
              variant="outline"
            >
              Move to {next.replace('_', ' ')}
            </Button>
          ))}
          <Button disabled={!canComment} onClick={() => setIsCommentOpen(true)} size="sm" type="button">
            Add Comment
          </Button>
          <Button
            disabled={!canComment || addWatcher.isPending || removeWatcher.isPending || meQuery.isLoading}
            onClick={() => {
              if (selfWatcher) {
                removeWatcher.mutate(selfWatcher.id);
              } else {
                addWatcher.mutate();
              }
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            {selfWatcher ? 'Unfollow' : 'Follow'}
          </Button>
          <Button
            disabled={!canManage}
            onClick={() => {
              setEditTemplateId(defaultTemplateId);
              setIsEditOpen(true);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Edit Ticket
          </Button>
          <Button
            disabled={!canManage || deleteTicket.isPending}
            onClick={() => {
              const ok = window.confirm(`Delete ${ticket.ticket_number}? This cannot be undone.`);
              if (ok) deleteTicket.mutate();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            {deleteTicket.isPending ? 'Deleting...' : 'Delete Ticket'}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Ticket Summary</CardTitle>
            <CardDescription>Customer, ownership, and workflow state.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <DetailItem label="Customer" value={ticket.customer?.name ?? '—'} />
            <DetailItem label="Assignee" value={ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : 'Unassigned'} />
            <DetailItem label="Created by" value={fullName(ticket.creator)} />
            <DetailItem label="Queue" value={ticket.queue_key ?? '—'} />
            <DetailItem label="Category" value={ticket.category ?? '—'} />
            <DetailItem label="Assignment" value={statusLabel(stateSummary?.assignment.strategy)} />
            <DetailItem
              label="Approval"
              value={stateSummary?.approval.pending_count ? `${stateSummary.approval.pending_count} pending` : statusLabel(stateSummary?.approval.latest_status) === '—' ? 'No active approval' : statusLabel(stateSummary?.approval.latest_status)}
            />
            <DetailItem label="Automation" value={stateSummary?.automation.recent_count ? `${stateSummary.automation.recent_count} recent runs` : 'No recent runs'} />
            <DetailItem label="Tags" value={ticket.tags && ticket.tags.length > 0 ? ticket.tags.join(', ') : '—'} />
            <DetailItem label="Updated" value={formatTicketDetailsDate(ticket.updated_at)} />
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>Conversation stays visible so handoffs and context are easy to follow.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(commentsQuery.data?.data ?? []).map((comment) => (
              <div key={comment.id} className="rounded-md border border-border p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant={comment.is_internal ? 'secondary' : 'outline'}>
                      {comment.is_internal ? 'Internal' : 'Public'}
                    </Badge>
                    <span>
                      {comment.user
                        ? `${comment.user.first_name} ${comment.user.last_name}`
                        : comment.customer
                          ? comment.customer.name
                          : 'System'}
                    </span>
                    <span>•</span>
                    <span>{formatTicketDetailsDate(comment.created_at)}</span>
                    {comment.updated_at && comment.updated_at !== comment.created_at && (
                      <>
                        <span>•</span>
                        <span>edited {formatTicketDetailsDate(comment.updated_at)}</span>
                      </>
                    )}
                  </div>
                  {canComment && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingCommentBody(comment.body);
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={deleteComment.isPending}
                        onClick={() => {
                          const ok = window.confirm('Delete this comment?');
                          if (ok) {
                            deleteComment.mutate(comment.id);
                          }
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      onChange={(event) => setEditingCommentBody(event.target.value)}
                      value={editingCommentBody}
                    />
                    <div className="flex gap-2">
                      <Button
                        disabled={updateComment.isPending || editingCommentBody.trim().length < 2}
                        onClick={() => updateComment.mutate({ commentId: comment.id, body: editingCommentBody })}
                        size="sm"
                        type="button"
                      >
                        {updateComment.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingCommentBody('');
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{comment.body}</p>
                )}

                {(attachmentsByComment[comment.id] ?? []).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {(attachmentsByComment[comment.id] ?? []).map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between rounded border border-border p-2">
                        <div className="text-xs">
                          <p className="font-medium">{attachment.original_name}</p>
                          <p className="text-muted-foreground">
                            {bytesToReadable(attachment.size_bytes)} • {formatTicketDetailsDate(attachment.created_at)}
                          </p>
                        </div>
                        <Button
                          onClick={() => apiDownload(`/workspaces/${workspaceSlug}/tickets/${ticketId}/attachments/${attachment.id}/download`, attachment.original_name)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!commentsQuery.data?.data.length && <p className="text-sm text-muted-foreground">No comments yet.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>State changes, automation, and assignment events in one running history.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activityLogs.map((event) => (
              <div key={event.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium">{humanizeAction(event.action)}</p>
                <p className="text-xs text-muted-foreground">{fullName(event.user)} • {formatTicketDetailsDate(event.created_at)}</p>
              </div>
            ))}
            {!activityLogs.length && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </CardContent>
        </Card>
        </div>

        <aside className="flex flex-col gap-6">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>SLA</CardTitle>
            <CardDescription>Response and resolution timing.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Badge variant={stateSummary?.sla.status === 'breached' ? 'destructive' : 'secondary'} className="w-fit">
              {statusLabel(stateSummary?.sla.status)}
            </Badge>
            <DetailItem label="First response due" value={formatTicketDetailsDate(ticket.first_response_due_at)} />
            <DetailItem label="First responded" value={formatTicketDetailsDate(ticket.first_responded_at)} />
            <DetailItem label="Resolution due" value={formatTicketDetailsDate(ticket.resolution_due_at)} />
            <DetailItem label="Resolved at" value={formatTicketDetailsDate(ticket.resolved_at)} />
            <Separator />
            {slaSignals.map((signal) => (
              <p key={signal.key} className={signal.severity === 'warning' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                {signal.label}{signal.time ? ` (${formatTicketDetailsDate(signal.time)})` : ''}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Ticket Tools</CardTitle>
            <CardDescription>Open focused panels instead of stacking every operator task on the page.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">Checklist</p>
              <p className="text-xs text-muted-foreground">{checklistItems.length} task{checklistItems.length === 1 ? '' : 's'} tracked</p>
            </div>
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">Attachments</p>
              <p className="text-xs text-muted-foreground">{ticketLevelAttachments.length} ticket-level file{ticketLevelAttachments.length === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">Watchers</p>
              <p className="text-xs text-muted-foreground">{watchers.length} follower{watchers.length === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">Related Tickets</p>
              <p className="text-xs text-muted-foreground">{relatedTickets.length} linked ticket{relatedTickets.length === 1 ? '' : 's'}</p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Button onClick={() => setIsChecklistOpen(true)} size="sm" type="button" variant="outline">
                Open Checklist
              </Button>
              <Button onClick={() => setIsAttachmentsOpen(true)} size="sm" type="button" variant="outline">
                Open Attachments
              </Button>
              <Button onClick={() => setIsWatchersOpen(true)} size="sm" type="button" variant="outline">
                Open Watchers
              </Button>
              <Button onClick={() => setIsRelatedOpen(true)} size="sm" type="button" variant="outline">
                Open Related Tickets
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {customFields.map((field) => (
              <DetailItem key={field.id} label={field.label ?? field.key ?? 'Field'} value={customFieldValue(field.value)} />
            ))}
            {!customFields.length && <p className="text-sm text-muted-foreground">No dynamic fields configured for this ticket.</p>}
          </CardContent>
        </Card>
        </aside>
      </div>

      <TicketDetailsSupportDialogs
        workspaceSlug={workspaceSlug}
        canComment={canComment}
        canManage={canManage}
        isCommentOpen={isCommentOpen}
        onCommentOpenChange={(open) => {
          setIsCommentOpen(open);
          if (!open) {
            commentForm.reset({ body: '', is_internal: false });
            setCommentFiles([]);
          }
        }}
        commentForm={commentForm}
        onSubmitComment={(values) => addComment.mutate(values)}
        isCommentPending={addComment.isPending}
        commentFiles={commentFiles}
        onCommentFilesChange={setCommentFiles}
        isChecklistOpen={isChecklistOpen}
        onChecklistOpenChange={(open) => {
          setIsChecklistOpen(open);
          if (!open) {
            checklistForm.reset({ title: '' });
          }
        }}
        checklistForm={checklistForm}
        checklistItems={checklistItems}
        onSubmitChecklist={(values) => addChecklistItem.mutate(values)}
        onToggleChecklistItem={(itemId, checked) => updateChecklistItem.mutate({ itemId, values: { is_completed: checked } })}
        onMoveChecklistItem={moveChecklistItem}
        onDeleteChecklistItem={(itemId) => deleteChecklistItem.mutate(itemId)}
        isChecklistMutating={
          addChecklistItem.isPending ||
          updateChecklistItem.isPending ||
          deleteChecklistItem.isPending ||
          reorderChecklistItems.isPending
        }
        checklistMutationError={checklistMutationError}
        isWatchersOpen={isWatchersOpen}
        onWatchersOpenChange={setIsWatchersOpen}
        watchers={watchers}
        watcherMutationError={watcherMutationError}
        isAttachmentsOpen={isAttachmentsOpen}
        onAttachmentsOpenChange={(open) => {
          setIsAttachmentsOpen(open);
          if (!open) {
            setAttachmentFile(null);
          }
        }}
        attachmentFile={attachmentFile}
        onAttachmentFileChange={setAttachmentFile}
        onUploadAttachment={() => uploadAttachment.mutate()}
        isUploadingAttachment={uploadAttachment.isPending}
        uploadAttachmentError={uploadAttachment.isError ? (uploadAttachment.error as Error).message : null}
        ticketLevelAttachments={ticketLevelAttachments}
        onDownloadAttachment={(attachmentId, originalName) => apiDownload(`/workspaces/${workspaceSlug}/tickets/${ticketId}/attachments/${attachmentId}/download`, originalName)}
        onDeleteAttachment={(attachmentId, originalName) => {
          const ok = window.confirm(`Delete ${originalName}?`);
          if (ok) {
            deleteAttachment.mutate(attachmentId);
          }
        }}
        isDeletingAttachment={deleteAttachment.isPending}
        isRelatedOpen={isRelatedOpen}
        onRelatedOpenChange={(open) => {
          setIsRelatedOpen(open);
          if (!open) {
            relatedTicketForm.reset({ related_ticket_id: '', relationship_type: 'related' });
          }
        }}
        relatedTicketForm={relatedTicketForm}
        onSubmitRelatedTicket={(values) => addRelatedTicket.mutate(values)}
        relatedTickets={relatedTickets}
        relatedTicketOptions={relatedTicketOptions}
        relatedTicketsCoverageHint={relatedTicketsCoverageHint}
        relatedTicketIdValue={relatedTicketIdValue}
        relatedTicketRelationshipValue={relatedTicketRelationshipValue}
        onDeleteRelatedTicket={(linkId) => deleteRelatedTicket.mutate(linkId)}
        isRelatedTicketPending={addRelatedTicket.isPending || deleteRelatedTicket.isPending}
        relatedTicketMutationError={relatedTicketMutationError}
      />

      <TicketDetailsEditSheet
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditTemplateId(defaultTemplateId);
          }
          setIsEditOpen(open);
        }}
        form={editForm}
        onSubmit={(values) => updateTicket.mutate(values)}
        isPending={updateTicket.isPending}
        errorMessage={updateTicket.isError ? (updateTicket.error as Error).message : null}
        customers={customers}
        customersCoverageHint={customersCoverageHint}
        members={members}
        ticketAssignee={ticket.assignee}
        activeTemplateConfigs={activeTemplateConfigs}
        effectiveEditTemplateId={effectiveEditTemplateId}
        onTemplateChange={setEditTemplateId}
        editCustomerIdValue={editCustomerIdValue}
        editAssigneeIdValue={editAssigneeIdValue}
        editStatusValue={editStatusValue}
        editPriorityValue={editPriorityValue}
        editCategoryValue={editCategoryValue}
        editQueueValue={editQueueValue}
        editCustomFieldsValue={editCustomFieldsValue}
        activeCategoryConfigs={activeCategoryConfigs}
        hasLegacyEditCategoryValue={hasLegacyEditCategoryValue}
        activeQueueConfigs={activeQueueConfigs}
        hasLegacyEditQueueValue={hasLegacyEditQueueValue}
        activeTagConfigs={activeTagConfigs}
        scopedCustomFieldConfigs={scopedCustomFieldConfigs}
      />
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}
