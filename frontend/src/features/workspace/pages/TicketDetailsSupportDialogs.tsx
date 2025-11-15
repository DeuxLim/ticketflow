import type { UseFormReturn } from 'react-hook-form';
import { TicketDetailsAttachmentsDialog } from '@/features/workspace/pages/TicketDetailsAttachmentsDialog';
import { TicketDetailsChecklistDialog } from '@/features/workspace/pages/TicketDetailsChecklistDialog';
import { TicketDetailsCommentDialog } from '@/features/workspace/pages/TicketDetailsCommentDialog';
import { TicketDetailsRelatedTicketsDialog, type RelatedTicketOption } from '@/features/workspace/pages/TicketDetailsRelatedTicketsDialog';
import { TicketDetailsWatchersDialog } from '@/features/workspace/pages/TicketDetailsWatchersDialog';
import {
  type ChecklistForm,
  type CommentForm,
  type RelatedTicketForm,
  type TicketDetailsAttachment,
} from '@/features/workspace/pages/ticketDetailsHelpers';
import type { Ticket, TicketChecklistItem } from '@/types/api';

type Props = {
  workspaceSlug?: string;
  canComment: boolean;
  canManage: boolean;
  isCommentOpen: boolean;
  onCommentOpenChange: (open: boolean) => void;
  commentForm: UseFormReturn<CommentForm>;
  onSubmitComment: (values: CommentForm) => void;
  isCommentPending: boolean;
  commentFiles: File[];
  onCommentFilesChange: (files: File[]) => void;
  isChecklistOpen: boolean;
  onChecklistOpenChange: (open: boolean) => void;
  checklistForm: UseFormReturn<ChecklistForm>;
  checklistItems: TicketChecklistItem[];
  onSubmitChecklist: (values: ChecklistForm) => void;
  onToggleChecklistItem: (itemId: number, checked: boolean) => void;
  onMoveChecklistItem: (itemId: number, direction: 'up' | 'down') => void;
  onDeleteChecklistItem: (itemId: number) => void;
  isChecklistMutating: boolean;
  checklistMutationError: unknown;
  isWatchersOpen: boolean;
  onWatchersOpenChange: (open: boolean) => void;
  watchers: NonNullable<Ticket['watchers']>;
  watcherMutationError: unknown;
  isAttachmentsOpen: boolean;
  onAttachmentsOpenChange: (open: boolean) => void;
  attachmentFile: File | null;
  onAttachmentFileChange: (file: File | null) => void;
  onUploadAttachment: () => void;
  isUploadingAttachment: boolean;
  uploadAttachmentError: string | null;
  ticketLevelAttachments: TicketDetailsAttachment[];
  onDownloadAttachment: (attachmentId: number, originalName: string) => void;
  onDeleteAttachment: (attachmentId: number, originalName: string) => void;
  isDeletingAttachment: boolean;
  isRelatedOpen: boolean;
  onRelatedOpenChange: (open: boolean) => void;
  relatedTicketForm: UseFormReturn<RelatedTicketForm>;
  onSubmitRelatedTicket: (values: RelatedTicketForm) => void;
  relatedTickets: NonNullable<Ticket['related_tickets']>;
  relatedTicketOptions: RelatedTicketOption[];
  relatedTicketsCoverageHint: string | null;
  relatedTicketIdValue?: string;
  relatedTicketRelationshipValue?: string;
  onDeleteRelatedTicket: (linkId: number) => void;
  isRelatedTicketPending: boolean;
  relatedTicketMutationError: unknown;
};

export function TicketDetailsSupportDialogs({
  workspaceSlug,
  canComment,
  canManage,
  isCommentOpen,
  onCommentOpenChange,
  commentForm,
  onSubmitComment,
  isCommentPending,
  commentFiles,
  onCommentFilesChange,
  isChecklistOpen,
  onChecklistOpenChange,
  checklistForm,
  checklistItems,
  onSubmitChecklist,
  onToggleChecklistItem,
  onMoveChecklistItem,
  onDeleteChecklistItem,
  isChecklistMutating,
  checklistMutationError,
  isWatchersOpen,
  onWatchersOpenChange,
  watchers,
  watcherMutationError,
  isAttachmentsOpen,
  onAttachmentsOpenChange,
  attachmentFile,
  onAttachmentFileChange,
  onUploadAttachment,
  isUploadingAttachment,
  uploadAttachmentError,
  ticketLevelAttachments,
  onDownloadAttachment,
  onDeleteAttachment,
  isDeletingAttachment,
  isRelatedOpen,
  onRelatedOpenChange,
  relatedTicketForm,
  onSubmitRelatedTicket,
  relatedTickets,
  relatedTicketOptions,
  relatedTicketsCoverageHint,
  relatedTicketIdValue,
  relatedTicketRelationshipValue,
  onDeleteRelatedTicket,
  isRelatedTicketPending,
  relatedTicketMutationError,
}: Props) {
  return (
    <>
      <TicketDetailsCommentDialog
        open={isCommentOpen}
        onOpenChange={onCommentOpenChange}
        form={commentForm}
        onSubmit={onSubmitComment}
        isPending={isCommentPending}
        files={commentFiles}
        onFilesChange={onCommentFilesChange}
      />

      <TicketDetailsChecklistDialog
        open={isChecklistOpen}
        onOpenChange={onChecklistOpenChange}
        canManage={canManage}
        form={checklistForm}
        items={checklistItems}
        onSubmit={onSubmitChecklist}
        onToggleItem={onToggleChecklistItem}
        onMoveItem={onMoveChecklistItem}
        onDeleteItem={onDeleteChecklistItem}
        isMutating={isChecklistMutating}
        mutationError={checklistMutationError}
      />

      <TicketDetailsWatchersDialog
        open={isWatchersOpen}
        onOpenChange={onWatchersOpenChange}
        watchers={watchers}
        mutationError={watcherMutationError}
      />

      <TicketDetailsAttachmentsDialog
        open={isAttachmentsOpen}
        onOpenChange={onAttachmentsOpenChange}
        canComment={canComment}
        canManage={canManage}
        attachmentFile={attachmentFile}
        onAttachmentFileChange={onAttachmentFileChange}
        onUploadAttachment={onUploadAttachment}
        isUploadingAttachment={isUploadingAttachment}
        uploadAttachmentError={uploadAttachmentError}
        attachments={ticketLevelAttachments}
        onDownloadAttachment={onDownloadAttachment}
        onDeleteAttachment={onDeleteAttachment}
        isDeletingAttachment={isDeletingAttachment}
      />

      <TicketDetailsRelatedTicketsDialog
        open={isRelatedOpen}
        onOpenChange={onRelatedOpenChange}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
        form={relatedTicketForm}
        onSubmit={onSubmitRelatedTicket}
        relatedTickets={relatedTickets}
        relatedTicketOptions={relatedTicketOptions}
        relatedTicketsCoverageHint={relatedTicketsCoverageHint}
        relatedTicketIdValue={relatedTicketIdValue}
        relatedTicketRelationshipValue={relatedTicketRelationshipValue}
        onDeleteRelatedTicket={onDeleteRelatedTicket}
        isPending={isRelatedTicketPending}
        mutationError={relatedTicketMutationError}
      />
    </>
  );
}
