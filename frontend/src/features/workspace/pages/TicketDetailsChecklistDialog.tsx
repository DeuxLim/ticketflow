import type { UseFormReturn } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { mutationErrorMessage, type ChecklistForm } from '@/features/workspace/pages/ticketDetailsHelpers';
import type { TicketChecklistItem } from '@/types/api';

type TicketDetailsChecklistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  form: UseFormReturn<ChecklistForm>;
  items: TicketChecklistItem[];
  onSubmit: (values: ChecklistForm) => void;
  onToggleItem: (itemId: number, checked: boolean) => void;
  onMoveItem: (itemId: number, direction: 'up' | 'down') => void;
  onDeleteItem: (itemId: number) => void;
  isMutating: boolean;
  mutationError: unknown;
};

export function TicketDetailsChecklistDialog({
  open,
  onOpenChange,
  canManage,
  form,
  items,
  onSubmit,
  onToggleItem,
  onMoveItem,
  onDeleteItem,
  isMutating,
  mutationError,
}: TicketDetailsChecklistDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Checklist</DialogTitle>
          <DialogDescription>Track the operator tasks that still block closure or handoff.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
              <label className="flex min-w-0 items-center gap-3 text-sm">
                <Checkbox
                  checked={item.is_completed}
                  disabled={!canManage || isMutating}
                  onCheckedChange={(checked) => onToggleItem(item.id, checked === true)}
                />
                <span className={item.is_completed ? 'text-muted-foreground line-through' : ''}>{item.title}</span>
              </label>
              <div className="flex items-center gap-2">
                {item.assignee && <Badge variant="secondary">{item.assignee.first_name} {item.assignee.last_name}</Badge>}
                {canManage && (
                  <>
                    <Button
                      disabled={isMutating || items[0]?.id === item.id}
                      onClick={() => onMoveItem(item.id, 'up')}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Up
                    </Button>
                    <Button
                      disabled={isMutating || items[items.length - 1]?.id === item.id}
                      onClick={() => onMoveItem(item.id, 'down')}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Down
                    </Button>
                    <Button disabled={isMutating} onClick={() => onDeleteItem(item.id)} size="sm" type="button" variant="outline">
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!items.length && <p className="text-sm text-muted-foreground">No tasks yet.</p>}

          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={form.handleSubmit(onSubmit)}>
            <Input disabled={!canManage} placeholder="Add an operator task..." {...form.register('title')} />
            <Button disabled={!canManage || isMutating} type="submit">
              {isMutating ? 'Adding...' : 'Add Task'}
            </Button>
          </form>
          {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
          {mutationError ? (
            <p className="text-xs text-destructive">{mutationErrorMessage(mutationError)}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
