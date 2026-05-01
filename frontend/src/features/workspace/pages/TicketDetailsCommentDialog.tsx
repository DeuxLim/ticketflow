import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CommentForm } from '@/features/workspace/pages/ticketDetailsHelpers';

type TicketDetailsCommentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CommentForm>;
  onSubmit: (values: CommentForm) => void;
  isPending: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
};

export function TicketDetailsCommentDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
  files,
  onFilesChange,
}: TicketDetailsCommentDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
          <DialogDescription>Internal comments are visible to workspace team members only.</DialogDescription>
        </DialogHeader>

        <form className="space-y-3" id="comment-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="comment-body">Comment</Label>
            <Textarea id="comment-body" {...form.register('body')} />
            {form.formState.errors.body && <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" {...form.register('is_internal')} />
            Internal comment
          </label>

          <div className="space-y-2">
            <Label htmlFor="comment-files">Attachments (optional)</Label>
            <Input
              id="comment-files"
              multiple
              onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))}
              type="file"
            />
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={form.formState.isSubmitting || isPending} form="comment-form" type="submit">
            {isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
