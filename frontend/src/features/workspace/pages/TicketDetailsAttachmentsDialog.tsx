import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  bytesToReadable,
  formatTicketDetailsDate,
  type TicketDetailsAttachment,
} from '@/features/workspace/pages/ticketDetailsHelpers';

type TicketDetailsAttachmentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canComment: boolean;
  canManage: boolean;
  attachmentFile: File | null;
  onAttachmentFileChange: (file: File | null) => void;
  onUploadAttachment: () => void;
  isUploadingAttachment: boolean;
  uploadAttachmentError: string | null;
  attachments: TicketDetailsAttachment[];
  onDownloadAttachment: (attachmentId: number, originalName: string) => void;
  onDeleteAttachment: (attachmentId: number, originalName: string) => void;
  isDeletingAttachment: boolean;
};

export function TicketDetailsAttachmentsDialog({
  open,
  onOpenChange,
  canComment,
  canManage,
  attachmentFile,
  onAttachmentFileChange,
  onUploadAttachment,
  isUploadingAttachment,
  uploadAttachmentError,
  attachments,
  onDownloadAttachment,
  onDeleteAttachment,
  isDeletingAttachment,
}: TicketDetailsAttachmentsDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
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

          {attachments.map((attachment) => (
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
          {!attachments.length && (
            <p className="text-sm text-muted-foreground">No ticket-level attachments yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
