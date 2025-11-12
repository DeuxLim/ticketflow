import type { UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TicketDetailsChecklistDialog } from '@/features/workspace/pages/TicketDetailsChecklistDialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketDetailsCommentDialog } from '@/features/workspace/pages/TicketDetailsCommentDialog';
import {
  bytesToReadable,
  formatTicketDetailsDate,
  mutationErrorMessage,
  statusLabel,
  type ChecklistForm,
  type CommentForm,
  type RelatedTicketForm,
  type TicketDetailsAttachment,
} from '@/features/workspace/pages/ticketDetailsHelpers';
import type { Ticket, TicketChecklistItem } from '@/types/api';

type RelatedTicketOption = {
  id: number;
  ticket_number: string;
  title: string;
};

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

      <Dialog onOpenChange={onWatchersOpenChange} open={isWatchersOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Watchers</DialogTitle>
            <DialogDescription>See who is following the ticket and keeping up with updates.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {watchers.map((watcher) => (
                <Badge key={watcher.id} variant="secondary">
                  {watcher.user ? `${watcher.user.first_name} ${watcher.user.last_name}` : `User ${watcher.user_id}`}
                </Badge>
              ))}
            </div>
            {!watchers.length && <p className="text-sm text-muted-foreground">No followers yet.</p>}
            {watcherMutationError ? (
              <p className="text-xs text-destructive">{mutationErrorMessage(watcherMutationError)}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={onAttachmentsOpenChange} open={isAttachmentsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Attachments</DialogTitle>
            <DialogDescription>Upload or review files without pushing upload controls into the main ticket view.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                accept="*/*"
                onChange={(event) => onAttachmentFileChange(event.target.files?.[0] ?? null)}
                type="file"
              />
              <Button
                disabled={!canComment || !attachmentFile || isUploadingAttachment}
                onClick={onUploadAttachment}
                size="sm"
                type="button"
              >
                {isUploadingAttachment ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
            {uploadAttachmentError && <p className="text-xs text-destructive">{uploadAttachmentError}</p>}

            {ticketLevelAttachments.map((attachment) => (
              <div key={attachment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{attachment.original_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bytesToReadable(attachment.size_bytes)} • {attachment.mime_type ?? 'Unknown type'} • {formatTicketDetailsDate(attachment.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onDownloadAttachment(attachment.id, attachment.original_name)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Download
                  </Button>
                  <Button
                    disabled={!canManage || isDeletingAttachment}
                    onClick={() => onDeleteAttachment(attachment.id, attachment.original_name)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {!ticketLevelAttachments.length && (
              <p className="text-sm text-muted-foreground">No ticket-level attachments yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={onRelatedOpenChange} open={isRelatedOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Related Tickets</DialogTitle>
            <DialogDescription>Connect incidents, blockers, duplicates, or follow-up work from one focused panel.</DialogDescription>
          </DialogHeader>

          <div className="mb-4 flex flex-col gap-3">
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
                    disabled={isRelatedTicketPending}
                    onClick={() => onDeleteRelatedTicket(link.id)}
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
          </div>

          <form className="space-y-3" id="related-ticket-form" onSubmit={relatedTicketForm.handleSubmit(onSubmitRelatedTicket)}>
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

          {relatedTicketMutationError ? (
            <p className="text-xs text-destructive">{mutationErrorMessage(relatedTicketMutationError)}</p>
          ) : null}

          <DialogFooter>
            <Button onClick={() => onRelatedOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isRelatedTicketPending || relatedTicketForm.formState.isSubmitting} form="related-ticket-form" type="submit">
              {isRelatedTicketPending ? 'Linking...' : 'Link Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
