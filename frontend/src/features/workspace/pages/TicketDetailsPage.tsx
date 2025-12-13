import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/app';
import { ForbiddenState } from '@/components/forbidden-state';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import {
  getWorkspaceTicket,
  listWorkspaceTicketActivity,
  listWorkspaceTicketAttachments,
  listWorkspaceTicketComments,
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
  ticketFormSchema,
  type TicketForm,
} from '@/features/workspace/pages/ticketForm';
import { useTicketDetailsAttachmentMutations } from '@/features/workspace/pages/useTicketDetailsAttachmentMutations';
import { useTicketDetailsChecklistMutations } from '@/features/workspace/pages/useTicketDetailsChecklistMutations';
import { useTicketDetailsCommentMutations } from '@/features/workspace/pages/useTicketDetailsCommentMutations';
import { useTicketDetailsRelatedTicketMutations } from '@/features/workspace/pages/useTicketDetailsRelatedTicketMutations';
import { useTicketDetailsTicketMutations } from '@/features/workspace/pages/useTicketDetailsTicketMutations';
import { useTicketDetailsWatcherMutations } from '@/features/workspace/pages/useTicketDetailsWatcherMutations';
import { useTicketDetailsDerivedState } from '@/features/workspace/pages/useTicketDetailsDerivedState';
import { listTicketCategories, listTicketCustomFields, listTicketFormTemplates, listTicketQueues, listTicketTags } from '@/features/workspace/api/settings-api';
import { ApiError, apiDownload, apiRequest } from '@/services/api/client';
import type { TicketChecklistItem, TicketComment, TicketRelatedTicket } from '@/types/api';

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
  const [isDeleteTicketOpen, setIsDeleteTicketOpen] = useState(false);
  const [deleteCommentTargetId, setDeleteCommentTargetId] = useState<number | null>(null);
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState<{ id: number; originalName: string } | null>(null);
  const [deleteChecklistTarget, setDeleteChecklistTarget] = useState<TicketChecklistItem | null>(null);
  const [deleteRelatedTicketTarget, setDeleteRelatedTicketTarget] = useState<TicketRelatedTicket | null>(null);
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

  const { addComment, updateComment, deleteComment } = useTicketDetailsCommentMutations({
    workspaceSlug,
    ticketId,
    commentFiles,
    onAddSuccess: () => {
      commentForm.reset({ body: '', is_internal: false });
      setCommentFiles([]);
      setIsCommentOpen(false);
      invalidateTicketThread();
    },
    onUpdateSuccess: () => {
      setEditingCommentId(null);
      setEditingCommentBody('');
      invalidateTicketComments();
      invalidateTicketActivity();
    },
    onDeleteSuccess: () => {
      invalidateTicketComments();
      invalidateTicketActivity();
      invalidateTicketAttachments();
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

  const ticket = ticketQuery.data?.data;
  const currentUserId = meQuery.data?.data.id;
  const {
    customers,
    members,
    activeQueueConfigs,
    activeCategoryConfigs,
    activeTagConfigs,
    activeTemplateConfigs,
    defaultTemplateId,
    effectiveEditTemplateId,
    scopedCustomFieldConfigs,
    relatedTicketOptions,
    relatedTicketsCoverageHint,
    customersCoverageHint,
    activityLogs,
    watchers,
    checklistItems,
    relatedTickets,
    customFields,
    ticketLevelAttachments,
    selfWatcher,
    editCustomerIdValue,
    editAssigneeIdValue,
    editStatusValue,
    editPriorityValue,
    editCustomFieldsValue,
    relatedTicketIdValue,
    relatedTicketRelationshipValue,
    editQueueValue,
    editCategoryValue,
    hasLegacyEditQueueValue,
    hasLegacyEditCategoryValue,
    attachmentsByComment,
    slaSignals,
  } = useTicketDetailsDerivedState({
    ticket,
    ticketId,
    customersResponse: customersQuery.data,
    membersResponse: membersQuery.data,
    queueConfigsResponse: queueConfigsQuery.data,
    categoryConfigsResponse: categoryConfigsQuery.data,
    tagConfigsResponse: tagConfigsQuery.data,
    customFieldConfigsResponse: customFieldConfigsQuery.data,
    templateConfigsResponse: templateConfigsQuery.data,
    relatedTicketOptionsResponse: relatedTicketOptionsQuery.data,
    attachmentsResponse: attachmentsQuery.data,
    activityResponse: activityQuery.data,
    currentUserId,
    editForm,
    relatedTicketForm,
    editTemplateId,
  });
  const { updateTicket, quickTransition, quickAssign, deleteTicket } = useTicketDetailsTicketMutations({
    workspaceSlug,
    ticketId,
    scopedCustomFieldConfigs,
    onUpdateSuccess: () => {
      setIsEditOpen(false);
      invalidateTicket();
      invalidateTicketList();
      invalidateTicketActivity();
    },
    onUpdateError: (error) => applyTicketFormFieldErrors(editForm, error),
    onTransitionSuccess: (payload) => {
      if ((payload as { message?: string }).message) {
        setQuickActionMessage((payload as { message?: string }).message ?? null);
      } else {
        setQuickActionMessage(null);
      }
      invalidateTicket();
      invalidateTicketActivity();
      invalidateTicketList();
    },
    onDeleteSuccess: () => {
      invalidateTicketList();
      navigate(`/workspaces/${workspaceSlug}/tickets`);
    },
  });
  const watcherMutationError = addWatcher.error ?? removeWatcher.error;
  const checklistMutationError = addChecklistItem.error ?? updateChecklistItem.error ?? deleteChecklistItem.error ?? reorderChecklistItems.error;
  const relatedTicketMutationError = addRelatedTicket.error ?? deleteRelatedTicket.error;

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
        onDeleteTicket={() => setIsDeleteTicketOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <TicketDetailsSummaryCard
            ticket={ticket}
            canManage={canManage}
            members={members}
            isAssigning={quickAssign.isPending}
            onAssign={(assigneeId) => {
              if (ticket.assigned_to_user_id === assigneeId) return;
              quickAssign.mutate(assigneeId);
            }}
          />

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
            onDeleteComment={setDeleteCommentTargetId}
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
        onDeleteChecklistItem={setDeleteChecklistTarget}
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
        onDeleteAttachment={(attachmentId, originalName) => setDeleteAttachmentTarget({ id: attachmentId, originalName })}
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
        onDeleteRelatedTicket={setDeleteRelatedTicketTarget}
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

      <ConfirmDialog
        open={isDeleteTicketOpen}
        onOpenChange={setIsDeleteTicketOpen}
        title="Delete ticket"
        description={`Delete ${ticket.ticket_number}? This cannot be undone.`}
        confirmLabel="Delete ticket"
        variant="destructive"
        isPending={deleteTicket.isPending}
        onConfirm={() => deleteTicket.mutate()}
      />

      <ConfirmDialog
        open={deleteCommentTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCommentTargetId(null);
        }}
        title="Delete comment"
        description="Delete this comment? This cannot be undone."
        confirmLabel="Delete comment"
        variant="destructive"
        isPending={deleteComment.isPending}
        onConfirm={() => {
          if (deleteCommentTargetId !== null) {
            deleteComment.mutate(deleteCommentTargetId, {
              onSuccess: () => setDeleteCommentTargetId(null),
            });
          }
        }}
      />

      <ConfirmDialog
        open={deleteAttachmentTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteAttachmentTarget(null);
        }}
        title="Delete attachment"
        description={`Delete ${deleteAttachmentTarget?.originalName ?? 'this attachment'}? This cannot be undone.`}
        confirmLabel="Delete attachment"
        variant="destructive"
        isPending={deleteAttachment.isPending}
        onConfirm={() => {
          if (deleteAttachmentTarget) {
            deleteAttachment.mutate(deleteAttachmentTarget.id, {
              onSuccess: () => setDeleteAttachmentTarget(null),
            });
          }
        }}
      />

      <ConfirmDialog
        open={deleteChecklistTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteChecklistTarget(null);
        }}
        title="Delete checklist item"
        description={`Delete ${deleteChecklistTarget?.title ?? 'this checklist item'}? This cannot be undone.`}
        confirmLabel="Delete item"
        variant="destructive"
        isPending={deleteChecklistItem.isPending}
        onConfirm={() => {
          if (deleteChecklistTarget) {
            deleteChecklistItem.mutate(deleteChecklistTarget.id, {
              onSuccess: () => setDeleteChecklistTarget(null),
            });
          }
        }}
      />

      <ConfirmDialog
        open={deleteRelatedTicketTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteRelatedTicketTarget(null);
        }}
        title="Remove related ticket"
        description={`Remove ${deleteRelatedTicketTarget?.ticket?.ticket_number ?? 'this related ticket'} from this ticket?`}
        confirmLabel="Remove link"
        variant="destructive"
        isPending={deleteRelatedTicket.isPending}
        onConfirm={() => {
          if (deleteRelatedTicketTarget) {
            deleteRelatedTicket.mutate(deleteRelatedTicketTarget.id, {
              onSuccess: () => setDeleteRelatedTicketTarget(null),
            });
          }
        }}
      />
    </section>
  );
}
