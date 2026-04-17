import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { listAssignableMembersForTickets, listRelatedTicketOptions, listTicketCustomersForSelectors } from '@/features/workspace/pages/ticketPageApi';
import { listTicketCategories, listTicketCustomFields, listTicketFormTemplates, listTicketQueues, listTicketTags } from '@/features/workspace/settings/settings-api';
import { selectorCoverageHint } from '@/features/workspace/utils/selectorCoverage';
import { ApiError, apiDownload, apiRequest } from '@/services/api/client';
import type { Ticket, TicketChecklistItem, TicketComment, TicketCustomFieldConfig, TicketCustomFieldValue, TicketFormTemplateConfig } from '@/types/api';

const commentSchema = z.object({
  body: z.string().min(2, 'Comment must not be empty'),
  is_internal: z.boolean(),
});

const ticketUpdateSchema = z.object({
  customer_id: z.string().min(1, 'Select a customer'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to_user_id: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  queue_key: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  custom_fields: z.record(z.string(), z.string()).optional(),
});

const checklistSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
});

const relatedTicketSchema = z.object({
  related_ticket_id: z.string().min(1, 'Select a ticket'),
  relationship_type: z.string().min(2, 'Relationship is required'),
});

type CommentForm = z.infer<typeof commentSchema>;
type TicketUpdateForm = z.infer<typeof ticketUpdateSchema>;
type ChecklistForm = z.infer<typeof checklistSchema>;
type RelatedTicketForm = z.infer<typeof relatedTicketSchema>;

type ActivityLog = {
  id: number;
  action: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  meta?: Record<string, unknown> | null;
};

type Attachment = {
  id: number;
  ticket_id: number;
  comment_id: number | null;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  uploader?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at: string;
};

type AuthUser = {
  id: number;
  email: string;
  is_platform_admin: boolean;
};

function applyTicketDetailsFieldErrors(
  form: UseFormReturn<TicketUpdateForm>,
  error: unknown,
) {
  if (!(error instanceof ApiError)) {
    return;
  }

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (!messages.length) continue;

    if (
      field === 'customer_id' ||
      field === 'title' ||
      field === 'description' ||
      field === 'status' ||
      field === 'priority' ||
      field === 'assigned_to_user_id' ||
      field === 'category' ||
      field === 'queue_key' ||
      field === 'tags'
    ) {
      form.setError(field, { type: 'server', message: messages[0] });
    }
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function fullName(person?: { first_name?: string; last_name?: string } | null): string {
  if (!person) return '—';
  return `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() || '—';
}

function bytesToReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function statusLabel(value?: string | null): string {
  return value ? value.replaceAll('_', ' ') : '—';
}

function mutationErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Action failed. Please try again.';
}

function parseTicketTags(value: string | undefined): string[] | null {
  if (!value) {
    return null;
  }

  const parsed = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : null;
}

function customFieldOptions(field: TicketCustomFieldConfig): string[] {
  return field.options
    .map((option) => (typeof option === 'string' ? option : null))
    .filter((option): option is string => option !== null);
}

function buildCustomFieldPayload(
  values: Record<string, string> | undefined,
  fieldConfigs: TicketCustomFieldConfig[],
): Record<string, unknown> {
  if (!values) {
    return {};
  }

  return fieldConfigs.reduce<Record<string, unknown>>((payload, field) => {
    const rawValue = values[field.key];
    if (rawValue === undefined || rawValue === '') {
      return payload;
    }

    if (field.field_type === 'number') {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) {
        payload[field.key] = parsed;
      }
      return payload;
    }

    if (field.field_type === 'checkbox') {
      payload[field.key] = rawValue === 'true';
      return payload;
    }

    if (field.field_type === 'multiselect') {
      payload[field.key] = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      return payload;
    }

    payload[field.key] = rawValue;
    return payload;
  }, {});
}

function templateFieldKeys(template: TicketFormTemplateConfig | null): Set<string> | null {
  if (!template) {
    return null;
  }

  const keys = template.field_schema
    .map((entry) => (typeof entry.key === 'string' ? entry.key : null))
    .filter((key): key is string => key !== null && key.length > 0);

  return keys.length > 0 ? new Set(keys) : new Set<string>();
}

function filterCustomFieldsByTemplate(
  fields: TicketCustomFieldConfig[],
  template: TicketFormTemplateConfig | null,
): TicketCustomFieldConfig[] {
  const keys = templateFieldKeys(template);
  if (keys === null) {
    return fields;
  }

  return fields.filter((field) => keys.has(field.key));
}

export function TicketDetailsPage() {
  const { workspaceSlug, ticketId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
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

  const editForm = useForm<TicketUpdateForm>({
    resolver: zodResolver(ticketUpdateSchema),
    defaultValues: {
      customer_id: '',
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      assigned_to_user_id: '',
      category: '',
      queue_key: '',
      tags: '',
      custom_fields: {},
    },
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
    queryFn: () => listWorkspaceTicketAttachments(workspaceSlug ?? '', ticketId ?? '') as Promise<{ data: Attachment[] }>,
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
    mutationFn: (values: TicketUpdateForm) =>
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
      applyTicketDetailsFieldErrors(editForm, error);
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
  const selfWatcher = watchers.find((watcher) => watcher.user_id === currentUserId);
  const editQueueValue = useWatch({ control: editForm.control, name: 'queue_key' }) || 'none';
  const editCategoryValue = useWatch({ control: editForm.control, name: 'category' }) || 'none';
  const hasLegacyEditQueueValue = editQueueValue !== 'none' && !activeQueueConfigs.some((queue) => queue.key === editQueueValue);
  const hasLegacyEditCategoryValue = editCategoryValue !== 'none' && !activeCategoryConfigs.some((category) => category.key === editCategoryValue);
  const watcherMutationError = addWatcher.error ?? removeWatcher.error;
  const checklistMutationError = addChecklistItem.error ?? updateChecklistItem.error ?? deleteChecklistItem.error ?? reorderChecklistItems.error;
  const relatedTicketMutationError = addRelatedTicket.error ?? deleteRelatedTicket.error;
  const attachmentsByComment = useMemo(() => {
    return attachments.reduce<Record<number, Attachment[]>>((acc, attachment) => {
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

  const assignmentHistory = useMemo(
    () => activityLogs.filter((event) => event.action === 'ticket.assignee_changed' || event.action === 'ticket.bulk_updated'),
    [activityLogs],
  );

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

    const persistedCustomFields = Object.fromEntries(
      (ticket.custom_fields ?? []).map((field) => [
        field.key ?? String(field.ticket_custom_field_id),
        field.value === null || field.value === undefined
          ? ''
          : Array.isArray(field.value)
            ? field.value.join(', ')
            : String(field.value),
      ]),
    );

    for (const config of activeConfigsForReset) {
      if (!(config.key in persistedCustomFields)) {
        persistedCustomFields[config.key] = '';
      }
    }

    editForm.reset({
      customer_id: String(ticket.customer_id),
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to_user_id: ticket.assigned_to_user_id ? String(ticket.assigned_to_user_id) : '',
      category: ticket.category ?? '',
      queue_key: ticket.queue_key ?? '',
      tags: (ticket.tags ?? []).join(', '),
      custom_fields: persistedCustomFields,
    });
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
            <DetailItem label="Updated" value={formatDate(ticket.updated_at)} />
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>Customer-visible and internal notes.</CardDescription>
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
                    <span>{formatDate(comment.created_at)}</span>
                    {comment.updated_at && comment.updated_at !== comment.created_at && (
                      <>
                        <span>•</span>
                        <span>edited {formatDate(comment.updated_at)}</span>
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
                            {bytesToReadable(attachment.size_bytes)} • {formatDate(attachment.created_at)}
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
            <CardTitle>Checklist</CardTitle>
            <CardDescription>Small tasks required before closing.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {checklistItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
                <label className="flex min-w-0 items-center gap-3 text-sm">
                  <Checkbox
                    checked={item.is_completed}
                    disabled={!canManage || updateChecklistItem.isPending}
                    onCheckedChange={(checked) => updateChecklistItem.mutate({ itemId: item.id, values: { is_completed: checked === true } })}
                  />
                  <span className={item.is_completed ? 'text-muted-foreground line-through' : ''}>{item.title}</span>
                </label>
                <div className="flex items-center gap-2">
                  {item.assignee && <Badge variant="secondary">{item.assignee.first_name} {item.assignee.last_name}</Badge>}
                  {canManage && (
                    <>
                      <Button
                        disabled={reorderChecklistItems.isPending || checklistItems[0]?.id === item.id}
                        onClick={() => moveChecklistItem(item.id, 'up')}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Up
                      </Button>
                      <Button
                        disabled={reorderChecklistItems.isPending || checklistItems[checklistItems.length - 1]?.id === item.id}
                        onClick={() => moveChecklistItem(item.id, 'down')}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Down
                      </Button>
                    </>
                  )}
                  {canManage && (
                    <Button disabled={deleteChecklistItem.isPending} onClick={() => deleteChecklistItem.mutate(item.id)} size="sm" type="button" variant="outline">
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!checklistItems.length && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={checklistForm.handleSubmit((values) => addChecklistItem.mutate(values))}>
              <Input disabled={!canManage} placeholder="Add an operator task…" {...checklistForm.register('title')} />
              <Button disabled={!canManage || addChecklistItem.isPending} type="submit">
                {addChecklistItem.isPending ? 'Adding…' : 'Add Task'}
              </Button>
            </form>
            {checklistForm.formState.errors.title && <p className="text-xs text-destructive">{checklistForm.formState.errors.title.message}</p>}
            {(addChecklistItem.isError || updateChecklistItem.isError || deleteChecklistItem.isError) && (
              <p className="text-xs text-destructive">{mutationErrorMessage(checklistMutationError)}</p>
            )}
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
            <DetailItem label="First response due" value={formatDate(ticket.first_response_due_at)} />
            <DetailItem label="First responded" value={formatDate(ticket.first_responded_at)} />
            <DetailItem label="Resolution due" value={formatDate(ticket.resolution_due_at)} />
            <DetailItem label="Resolved at" value={formatDate(ticket.resolved_at)} />
            <Separator />
            {slaSignals.map((signal) => (
              <p key={signal.key} className={signal.severity === 'warning' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                {signal.label}{signal.time ? ` (${formatDate(signal.time)})` : ''}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Assignment History</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {assignmentHistory.map((event) => {
              const from = event.meta?.from ?? event.meta?.assigned_to_user_id ?? null;
              const to = event.meta?.to ?? event.meta?.assigned_to_user_id ?? null;

              return (
                <div key={event.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">{humanizeAction(event.action)}</p>
                  {(from !== null || to !== null) && (
                    <p className="text-xs text-muted-foreground">From: {String(from ?? 'Unassigned')} · To: {String(to ?? 'Unassigned')}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{fullName(event.user)} · {formatDate(event.created_at)}</p>
                </div>
              );
            })}
            {!assignmentHistory.length && <p className="text-sm text-muted-foreground">No assignment changes yet.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Watchers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {watchers.map((watcher) => (
                <Badge key={watcher.id} variant="secondary">
                  {watcher.user ? `${watcher.user.first_name} ${watcher.user.last_name}` : `User ${watcher.user_id}`}
                </Badge>
              ))}
            </div>
            {!watchers.length && <p className="text-sm text-muted-foreground">No followers yet.</p>}
            {(addWatcher.isError || removeWatcher.isError) && (
              <p className="text-xs text-destructive">{mutationErrorMessage(watcherMutationError)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Related Tickets</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
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
                    disabled={deleteRelatedTicket.isPending}
                    onClick={() => deleteRelatedTicket.mutate(link.id)}
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
            <Button disabled={!canManage} onClick={() => setIsRelatedOpen(true)} size="sm" type="button" variant="outline">
              Link Ticket
            </Button>
            {(addRelatedTicket.isError || deleteRelatedTicket.isError) && (
              <p className="text-xs text-destructive">{mutationErrorMessage(relatedTicketMutationError)}</p>
            )}
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

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                accept="*/*"
                onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <Button
                disabled={!canComment || !attachmentFile || uploadAttachment.isPending}
                onClick={() => uploadAttachment.mutate()}
                size="sm"
                type="button"
              >
                {uploadAttachment.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
            {uploadAttachment.isError && <p className="text-xs text-destructive">{(uploadAttachment.error as Error).message}</p>}

            {attachments.filter((attachment) => attachment.comment_id === null).map((attachment) => (
              <div key={attachment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{attachment.original_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bytesToReadable(attachment.size_bytes)} • {attachment.mime_type ?? 'Unknown type'} • {formatDate(attachment.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => apiDownload(`/workspaces/${workspaceSlug}/tickets/${ticketId}/attachments/${attachment.id}/download`, attachment.original_name)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Download
                  </Button>
                  <Button
                    disabled={!canManage || deleteAttachment.isPending}
                    onClick={() => {
                      const ok = window.confirm(`Delete ${attachment.original_name}?`);
                      if (ok) deleteAttachment.mutate(attachment.id);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {!attachments.some((attachment) => attachment.comment_id === null) && (
              <p className="text-sm text-muted-foreground">No ticket-level attachments yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {activityLogs.map((event) => (
            <div key={event.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">{humanizeAction(event.action)}</p>
              <p className="text-xs text-muted-foreground">{fullName(event.user)} • {formatDate(event.created_at)}</p>
            </div>
          ))}
          {!activityLogs.length && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        </CardContent>
      </Card>
        </aside>
      </div>

      <Dialog
        onOpenChange={(open) => {
          setIsCommentOpen(open);
          if (!open) {
            commentForm.reset({ body: '', is_internal: false });
            setCommentFiles([]);
          }
        }}
        open={isCommentOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>Internal comments are visible to workspace team members only.</DialogDescription>
          </DialogHeader>

          <form className="space-y-3" id="comment-form" onSubmit={commentForm.handleSubmit((values) => addComment.mutate(values))}>
            <div className="space-y-2">
              <Label htmlFor="comment-body">Comment</Label>
              <Textarea id="comment-body" {...commentForm.register('body')} />
              {commentForm.formState.errors.body && <p className="text-xs text-destructive">{commentForm.formState.errors.body.message}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...commentForm.register('is_internal')} />
              Internal comment
            </label>

            <div className="space-y-2">
              <Label htmlFor="comment-files">Attachments (optional)</Label>
              <Input
                id="comment-files"
                multiple
                onChange={(event) => setCommentFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
              {commentFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {commentFiles.length} file{commentFiles.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </form>

          <DialogFooter>
            <Button onClick={() => setIsCommentOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={commentForm.formState.isSubmitting || addComment.isPending} form="comment-form" type="submit">
              {addComment.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          setIsRelatedOpen(open);
          if (!open) {
            relatedTicketForm.reset({ related_ticket_id: '', relationship_type: 'related' });
          }
        }}
        open={isRelatedOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Related Ticket</DialogTitle>
            <DialogDescription>Connect incidents, blockers, duplicates, or follow-up work.</DialogDescription>
          </DialogHeader>

          <form className="space-y-3" id="related-ticket-form" onSubmit={relatedTicketForm.handleSubmit((values) => addRelatedTicket.mutate(values))}>
            <div className="space-y-2">
              <Label>Ticket</Label>
              <Select
                onValueChange={(value) => relatedTicketForm.setValue('related_ticket_id', value ?? '', { shouldValidate: true })}
                value={relatedTicketIdValue ?? ''}
              >
                <SelectTrigger><SelectValue placeholder="Select ticket" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {relatedTicketOptions.map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.ticket_number} — {option.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {relatedTicketsCoverageHint && (
                <p className="text-xs text-muted-foreground">{relatedTicketsCoverageHint}</p>
              )}
              {relatedTicketForm.formState.errors.related_ticket_id && <p className="text-xs text-destructive">{relatedTicketForm.formState.errors.related_ticket_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                onValueChange={(value) => relatedTicketForm.setValue('relationship_type', value ?? 'related', { shouldValidate: true })}
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
              {relatedTicketForm.formState.errors.relationship_type && <p className="text-xs text-destructive">{relatedTicketForm.formState.errors.relationship_type.message}</p>}
            </div>
          </form>

          {addRelatedTicket.isError && (
            <p className="text-xs text-destructive">{mutationErrorMessage(relatedTicketMutationError)}</p>
          )}

          <DialogFooter>
            <Button onClick={() => setIsRelatedOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={addRelatedTicket.isPending || relatedTicketForm.formState.isSubmitting} form="related-ticket-form" type="submit">
              {addRelatedTicket.isPending ? 'Linking...' : 'Link Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditTemplateId(defaultTemplateId);
          }
          setIsEditOpen(open);
        }}
        open={isEditOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>Update assignment, priority, status, and operational metadata.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" id="edit-ticket-details-form" onSubmit={editForm.handleSubmit((values) => updateTicket.mutate(values))}>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                onValueChange={(value) => editForm.setValue('customer_id', value ?? '', { shouldValidate: true })}
                value={editCustomerIdValue ?? ''}
              >
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
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
              {customersCoverageHint && (
                <p className="text-xs text-muted-foreground">{customersCoverageHint}</p>
              )}
              {editForm.formState.errors.customer_id && <p className="text-xs text-destructive">{editForm.formState.errors.customer_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                onValueChange={(value) => editForm.setValue('assigned_to_user_id', value === 'none' || value === null ? '' : value)}
                value={editAssigneeIdValue || 'none'}
              >
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="details-template">Form Template</Label>
              <Select
                onValueChange={(value) => setEditTemplateId(value ?? 'none')}
                value={effectiveEditTemplateId}
              >
                <SelectTrigger id="details-template"><SelectValue placeholder="All active fields" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">All active fields</SelectItem>
                    {activeTemplateConfigs.map((template) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details-title">Title</Label>
              <Input id="details-title" {...editForm.register('title')} />
              {editForm.formState.errors.title && <p className="text-xs text-destructive">{editForm.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(value) => editForm.setValue('status', value as TicketUpdateForm['status'])}
                value={editStatusValue ?? 'open'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                onValueChange={(value) => editForm.setValue('priority', value as TicketUpdateForm['priority'])}
                value={editPriorityValue ?? 'medium'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details-category">Category</Label>
              <Select
                onValueChange={(value) => editForm.setValue('category', value === 'none' || value === null ? '' : value)}
                value={editCategoryValue}
              >
                <SelectTrigger id="details-category"><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">No category</SelectItem>
                    {activeCategoryConfigs.map((category) => (
                      <SelectItem key={category.id} value={category.key}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {hasLegacyEditCategoryValue && <SelectItem value={editCategoryValue}>{editCategoryValue} (legacy)</SelectItem>}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details-queue">Queue</Label>
              <Select
                onValueChange={(value) => editForm.setValue('queue_key', value === 'none' || value === null ? '' : value)}
                value={editQueueValue}
              >
                <SelectTrigger id="details-queue"><SelectValue placeholder="Default queue" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Default queue</SelectItem>
                    {activeQueueConfigs.map((queue) => (
                      <SelectItem key={queue.id} value={queue.key}>
                        {queue.name}
                      </SelectItem>
                    ))}
                    {hasLegacyEditQueueValue && <SelectItem value={editQueueValue}>{editQueueValue} (legacy)</SelectItem>}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="details-description">Description</Label>
              <Textarea id="details-description" {...editForm.register('description')} />
              {editForm.formState.errors.description && <p className="text-xs text-destructive">{editForm.formState.errors.description.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="details-tags">Tags (comma separated)</Label>
              <Input id="details-tags" list="details-tag-options" placeholder="network, vpn, urgent" {...editForm.register('tags')} />
              {activeTagConfigs.length > 0 && (
                <>
                  <datalist id="details-tag-options">
                    {activeTagConfigs.map((tag) => (
                      <option key={tag.id} value={tag.name} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">Available tags: {activeTagConfigs.map((tag) => tag.name).join(', ')}</p>
                </>
              )}
            </div>

            {scopedCustomFieldConfigs.length > 0 && (
              <div className="space-y-3 md:col-span-2">
                <p className="text-sm font-medium">Dynamic Fields</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {scopedCustomFieldConfigs.map((field) => {
                    const fieldPath = `custom_fields.${field.key}` as const;

                    if (field.field_type === 'textarea') {
                      return (
                        <div key={field.id} className="space-y-2 md:col-span-2">
                          <Label htmlFor={`custom-field-${field.key}`}>{field.label}</Label>
                          <Textarea id={`custom-field-${field.key}`} {...editForm.register(fieldPath)} />
                        </div>
                      );
                    }

                    if (field.field_type === 'select') {
                      const options = customFieldOptions(field);
                      const value = editCustomFieldsValue?.[field.key] ?? '';
                      return (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={`custom-field-${field.key}`}>{field.label}</Label>
                          <Select
                            onValueChange={(nextValue) => editForm.setValue(fieldPath, nextValue === 'none' || nextValue === null ? '' : nextValue)}
                            value={value || 'none'}
                          >
                            <SelectTrigger id={`custom-field-${field.key}`}><SelectValue placeholder="Not set" /></SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="none">Not set</SelectItem>
                                {options.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }

                    if (field.field_type === 'checkbox') {
                      const value = editCustomFieldsValue?.[field.key] ?? '';
                      return (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={`custom-field-${field.key}`}>{field.label}</Label>
                          <Select
                            onValueChange={(nextValue) => editForm.setValue(fieldPath, nextValue === 'none' || nextValue === null ? '' : nextValue)}
                            value={value || 'none'}
                          >
                            <SelectTrigger id={`custom-field-${field.key}`}><SelectValue placeholder="Not set" /></SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="none">Not set</SelectItem>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }

                    const inputType = field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text';
                    const placeholder = field.field_type === 'multiselect' ? 'Comma separated values' : undefined;

                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`custom-field-${field.key}`}>{field.label}</Label>
                        <Input
                          id={`custom-field-${field.key}`}
                          placeholder={placeholder}
                          type={inputType}
                          {...editForm.register(fieldPath)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>

          {updateTicket.isError && <p className="text-xs text-destructive">{(updateTicket.error as Error).message}</p>}

          <DialogFooter>
            <Button onClick={() => setIsEditOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={updateTicket.isPending || editForm.formState.isSubmitting} form="edit-ticket-details-form" type="submit">
              {updateTicket.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
