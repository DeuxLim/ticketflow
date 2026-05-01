import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ForbiddenState } from '@/components/forbidden-state';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import {
  createWorkspaceTicketComment,
  deleteWorkspaceTicket,
  deleteWorkspaceTicketComment,
  getWorkspaceTicket,
  listWorkspaceTicketActivity,
  listWorkspaceTicketAttachments,
  listWorkspaceTicketComments,
  transitionWorkspaceTicket,
  updateWorkspaceTicketComment,
  updateWorkspaceTicket,
  uploadWorkspaceTicketAttachment,
} from '@/features/workspace/api/ticketDetailsApi';
import { TicketDetailsCommentsCard } from '@/features/workspace/pages/TicketDetailsCommentsCard';
import { TicketDetailsEditSheet } from '@/features/workspace/pages/TicketDetailsEditSheet';
import { TicketDetailsHeader } from '@/features/workspace/pages/TicketDetailsHeader';
import {
  TicketActivityCard,
  TicketCustomFieldsCard,
  TicketSlaCard,
  TicketDetailsSummaryCard,
  TicketToolsCard,
} from '@/features/workspace/pages/TicketDetailsOverviewCards';
import { TicketDetailsSupportDialogs } from '@/features/workspace/pages/TicketDetailsSupportDialogs';
import {
  buildTicketDetailsFormValues,
  checklistSchema,
  commentSchema,
  createTicketDetailsFormDefaults,
  relatedTicketSchema,
  type ActivityLog,
  type ChecklistForm,
  type CommentForm,
  type RelatedTicketForm,
  type TicketDetailsAttachment,
} from '@/features/workspace/pages/ticketDetailsHelpers';
import { listAssignableMembersForTickets, listRelatedTicketOptions, listTicketCustomersForSelectors } from '@/features/workspace/api/ticketPageApi';
import {
  applyTicketFormFieldErrors,
  buildCustomFieldPayload,
  filterCustomFieldsByTemplate,
  parseTicketTags,
  ticketFormSchema,
  type TicketForm,
} from '@/features/workspace/pages/ticketForm';
import { useTicketDetailsAttachmentMutations } from '@/features/workspace/pages/useTicketDetailsAttachmentMutations';
import { useTicketDetailsChecklistMutations } from '@/features/workspace/pages/useTicketDetailsChecklistMutations';
import { useTicketDetailsRelatedTicketMutations } from '@/features/workspace/pages/useTicketDetailsRelatedTicketMutations';
import { useTicketDetailsWatcherMutations } from '@/features/workspace/pages/useTicketDetailsWatcherMutations';
import { listTicketCategories, listTicketCustomFields, listTicketFormTemplates, listTicketQueues, listTicketTags } from '@/features/workspace/api/settings-api';
import { selectorCoverageHint } from '@/features/workspace/utils/selectorCoverage';
import { ApiError, apiDownload, apiRequest } from '@/services/api/client';
import type { Ticket, TicketComment } from '@/types/api';

type AuthUser = {
  id: number;
  email: string;
  is_platform_admin: boolean;
};

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

  const invalidateTicket = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId] });
  };

  const invalidateTicketActivity = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'activity'] });
  };

  const invalidateTicketAttachments = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'attachments'] });
  };

  const invalidateTicketComments = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket', ticketId, 'comments'] });
  };

  const invalidateTicketList = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tickets'] });
  };

  const invalidateTicketAndActivity = () => {
    invalidateTicket();
    invalidateTicketActivity();
  };

  const invalidateTicketThread = () => {
    invalidateTicket();
    invalidateTicketActivity();
    invalidateTicketAttachments();
    invalidateTicketComments();
  };

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
      invalidateTicketThread();
    },
  });

  const updateComment = useMutation({
    mutationFn: ({ commentId, body }: { commentId: number; body: string }) =>
      updateWorkspaceTicketComment(workspaceSlug ?? '', ticketId ?? '', commentId, { body }),
    onSuccess: () => {
      setEditingCommentId(null);
      setEditingCommentBody('');
      invalidateTicketComments();
      invalidateTicketActivity();
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: number) =>
      deleteWorkspaceTicketComment(workspaceSlug ?? '', ticketId ?? '', commentId),
    onSuccess: () => {
      invalidateTicketComments();
      invalidateTicketActivity();
      invalidateTicketAttachments();
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
      invalidateTicket();
      invalidateTicketList();
      invalidateTicketActivity();
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
      invalidateTicket();
      invalidateTicketActivity();
      invalidateTicketList();
    },
  });

  const { uploadAttachment, deleteAttachment } = useTicketDetailsAttachmentMutations({
    workspaceSlug,
    ticketId,
    attachmentFile,
    onUploadSuccess: () => {
      setAttachmentFile(null);
      invalidateTicketAttachments();
      invalidateTicketActivity();
    },
    onDeleteSuccess: () => {
      invalidateTicketAttachments();
      invalidateTicketActivity();
    },
  });

  const { addWatcher, removeWatcher } = useTicketDetailsWatcherMutations({
    workspaceSlug,
    ticketId,
    onSuccess: invalidateTicketAndActivity,
  });

  const {
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    reorderChecklistItems,
  } = useTicketDetailsChecklistMutations({
    workspaceSlug,
    ticketId,
    onAddSuccess: () => {
      checklistForm.reset({ title: '' });
      invalidateTicketAndActivity();
    },
    onMutationSuccess: invalidateTicketAndActivity,
  });

  const { addRelatedTicket, deleteRelatedTicket } = useTicketDetailsRelatedTicketMutations({
    workspaceSlug,
    ticketId,
    onAddSuccess: () => {
      relatedTicketForm.reset({ related_ticket_id: '', relationship_type: 'related' });
      setIsRelatedOpen(false);
      invalidateTicketAndActivity();
    },
    onDeleteSuccess: invalidateTicketAndActivity,
  });

  const deleteTicket = useMutation({
    mutationFn: () => deleteWorkspaceTicket(workspaceSlug ?? '', ticketId ?? ''),
    onSuccess: () => {
      invalidateTicketList();
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
      <TicketDetailsHeader
        ticket={ticket}
        quickActionMessage={quickActionMessage}
        canComment={canComment}
        canManage={canManage}
        selfWatcher={selfWatcher}
        isTransitioning={quickTransition.isPending}
        isWatcherMutating={addWatcher.isPending || removeWatcher.isPending}
        isLoadingCurrentUser={meQuery.isLoading}
        isDeletingTicket={deleteTicket.isPending}
        onTransition={(status) => quickTransition.mutate(status)}
        onOpenComment={() => setIsCommentOpen(true)}
        onFollowTicket={() => addWatcher.mutate()}
        onUnfollowTicket={(watcherId) => removeWatcher.mutate(watcherId)}
        onOpenEdit={() => {
          setEditTemplateId(defaultTemplateId);
          setIsEditOpen(true);
        }}
        onDeleteTicket={() => {
          const ok = window.confirm(`Delete ${ticket.ticket_number}? This cannot be undone.`);
          if (ok) deleteTicket.mutate();
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <TicketDetailsSummaryCard ticket={ticket} />

          <TicketDetailsCommentsCard
            comments={commentsQuery.data?.data ?? []}
            attachmentsByComment={attachmentsByComment}
            canComment={canComment}
            editingCommentId={editingCommentId}
            editingCommentBody={editingCommentBody}
            isUpdatingComment={updateComment.isPending}
            isDeletingComment={deleteComment.isPending}
            onStartEdit={(comment) => {
              setEditingCommentId(comment.id);
              setEditingCommentBody(comment.body);
            }}
            onEditingCommentBodyChange={setEditingCommentBody}
            onSaveEdit={(commentId, body) => updateComment.mutate({ commentId, body })}
            onCancelEdit={() => {
              setEditingCommentId(null);
              setEditingCommentBody('');
            }}
            onDeleteComment={(commentId) => {
              const ok = window.confirm('Delete this comment?');
              if (ok) {
                deleteComment.mutate(commentId);
              }
            }}
            onDownloadAttachment={(attachmentId, originalName) =>
              apiDownload(`/workspaces/${workspaceSlug}/tickets/${ticketId}/attachments/${attachmentId}/download`, originalName)
            }
          />

          <TicketActivityCard activityLogs={activityLogs} />
        </div>

        <aside className="flex flex-col gap-6">
          <TicketSlaCard ticket={ticket} slaSignals={slaSignals} />

          <TicketToolsCard
            checklistCount={checklistItems.length}
            ticketLevelAttachmentCount={ticketLevelAttachments.length}
            watcherCount={watchers.length}
            relatedTicketCount={relatedTickets.length}
            onOpenChecklist={() => setIsChecklistOpen(true)}
            onOpenAttachments={() => setIsAttachmentsOpen(true)}
            onOpenWatchers={() => setIsWatchersOpen(true)}
            onOpenRelatedTickets={() => setIsRelatedOpen(true)}
          />

          <TicketCustomFieldsCard customFields={customFields} />
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
