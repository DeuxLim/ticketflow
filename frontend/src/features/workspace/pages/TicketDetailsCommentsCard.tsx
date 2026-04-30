import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { bytesToReadable, formatTicketDetailsDate, type TicketDetailsAttachment } from '@/features/workspace/pages/ticketDetailsHelpers';
import type { TicketComment } from '@/types/api';

type TicketDetailsCommentsCardProps = {
  comments: TicketComment[];
  attachmentsByComment: Record<number, TicketDetailsAttachment[]>;
  canComment: boolean;
  editingCommentId: number | null;
  editingCommentBody: string;
  isUpdatingComment: boolean;
  isDeletingComment: boolean;
  onStartEdit: (comment: TicketComment) => void;
  onEditingCommentBodyChange: (body: string) => void;
  onSaveEdit: (commentId: number, body: string) => void;
  onCancelEdit: () => void;
  onDeleteComment: (commentId: number) => void;
  onDownloadAttachment: (attachmentId: number, originalName: string) => void;
};

export function TicketDetailsCommentsCard({
  comments,
  attachmentsByComment,
  canComment,
  editingCommentId,
  editingCommentBody,
  isUpdatingComment,
  isDeletingComment,
  onStartEdit,
  onEditingCommentBodyChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteComment,
  onDownloadAttachment,
}: TicketDetailsCommentsCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>Conversation stays visible so handoffs and context are easy to follow.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            attachments={attachmentsByComment[comment.id] ?? []}
            canComment={canComment}
            isEditing={editingCommentId === comment.id}
            editingBody={editingCommentBody}
            isUpdating={isUpdatingComment}
            isDeleting={isDeletingComment}
            onStartEdit={onStartEdit}
            onEditingBodyChange={onEditingCommentBodyChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onDeleteComment={onDeleteComment}
            onDownloadAttachment={onDownloadAttachment}
          />
        ))}
        {!comments.length && <p className="text-sm text-muted-foreground">No comments yet.</p>}
      </CardContent>
    </Card>
  );
}

type CommentItemProps = {
  comment: TicketComment;
  attachments: TicketDetailsAttachment[];
  canComment: boolean;
  isEditing: boolean;
  editingBody: string;
  isUpdating: boolean;
  isDeleting: boolean;
  onStartEdit: (comment: TicketComment) => void;
  onEditingBodyChange: (body: string) => void;
  onSaveEdit: (commentId: number, body: string) => void;
  onCancelEdit: () => void;
  onDeleteComment: (commentId: number) => void;
  onDownloadAttachment: (attachmentId: number, originalName: string) => void;
};

function CommentItem({
  comment,
  attachments,
  canComment,
  isEditing,
  editingBody,
  isUpdating,
  isDeleting,
  onStartEdit,
  onEditingBodyChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteComment,
  onDownloadAttachment,
}: CommentItemProps) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <CommentMeta comment={comment} />

        {canComment && (
          <div className="flex gap-2">
            <Button onClick={() => onStartEdit(comment)} size="sm" type="button" variant="outline">
              Edit
            </Button>
            <Button disabled={isDeleting} onClick={() => onDeleteComment(comment.id)} size="sm" type="button" variant="outline">
              Delete
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea onChange={(event) => onEditingBodyChange(event.target.value)} value={editingBody} />
          <div className="flex gap-2">
            <Button
              disabled={isUpdating || editingBody.trim().length < 2}
              onClick={() => onSaveEdit(comment.id, editingBody)}
              size="sm"
              type="button"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={onCancelEdit} size="sm" type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm">{comment.body}</p>
      )}

      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between rounded border border-border p-2">
              <div className="text-xs">
                <p className="font-medium">{attachment.original_name}</p>
                <p className="text-muted-foreground">
                  {bytesToReadable(attachment.size_bytes)} • {formatTicketDetailsDate(attachment.created_at)}
                </p>
              </div>
              <Button
                onClick={() => onDownloadAttachment(attachment.id, attachment.original_name)}
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
  );
}

function CommentMeta({ comment }: { comment: TicketComment }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={comment.is_internal ? 'secondary' : 'outline'}>
        {comment.is_internal ? 'Internal' : 'Public'}
      </Badge>
      <span>{commentAuthor(comment)}</span>
      <span>•</span>
      <span>{formatTicketDetailsDate(comment.created_at)}</span>
      {comment.updated_at && comment.updated_at !== comment.created_at && (
        <>
          <span>•</span>
          <span>edited {formatTicketDetailsDate(comment.updated_at)}</span>
        </>
      )}
    </div>
  );
}

function commentAuthor(comment: TicketComment): string {
  if (comment.user) {
    return `${comment.user.first_name} ${comment.user.last_name}`;
  }

  return comment.customer?.name ?? 'System';
}
