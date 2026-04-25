import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { DraftRow, DraftValueType, WorkspaceEditorKind } from '@/features/admin/pages/adminWorkspaceEditorHelpers';
import type { AdminWorkspace } from '@/types/api';

let nextDraftRowId = 1;

function createEmptyDraftRow(): DraftRow {
  return { id: nextDraftRowId++, key: '', type: 'string', value: '' };
}

type Props = {
  open: boolean;
  workspace: AdminWorkspace | null;
  kind: WorkspaceEditorKind;
  rows: DraftRow[];
  errorMessage: string | null;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeRows: (rows: DraftRow[]) => void;
  onReset: () => void;
  onSave: (rows: DraftRow[]) => void;
};

export function AdminWorkspaceEditorDialog({
  open,
  workspace,
  kind,
  rows,
  errorMessage,
  disabled,
  onOpenChange,
  onChangeRows,
  onReset,
  onSave,
}: Props) {
  if (!workspace) {
    return null;
  }

  const title = kind === 'limits' ? 'Usage limits' : 'Feature flags';
  const dialogTitle = kind === 'limits' ? 'Manage Usage Limits' : 'Manage Feature Flags';
  const description = kind === 'limits'
    ? `Edit quota keys and values for ${workspace.name} (${workspace.slug}).`
    : `Edit enabled experiences and rollout switches for ${workspace.name} (${workspace.slug}).`;
  const saveButtonLabel = kind === 'limits' ? 'Save limits' : 'Save feature flags';

  const updateRow = (targetRowId: number, updater: (row: DraftRow) => DraftRow) => {
    onChangeRows(rows.map((row) => (row.id === targetRowId ? updater(row) : row)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex w-full flex-col gap-2 rounded border border-border/70 p-2 text-left">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_1fr_auto]">
                <Input
                  aria-label={`${title} key`}
                  placeholder="key"
                  value={row.key}
                  onChange={(event) => updateRow(row.id, (current) => ({ ...current, key: event.target.value }))}
                />
                <select
                  aria-label={`${title} type`}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={row.type}
                  onChange={(event) =>
                    updateRow(row.id, (current) => ({
                      ...current,
                      type: event.target.value as DraftValueType,
                      value: event.target.value === 'boolean' ? 'false' : current.value,
                    }))
                  }
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                </select>
                {row.type === 'boolean' ? (
                  <select
                    aria-label={`${title} value`}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={row.value}
                    onChange={(event) => updateRow(row.id, (current) => ({ ...current, value: event.target.value }))}
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                ) : (
                  <Input
                    aria-label={`${title} value`}
                    placeholder="value"
                    type={row.type === 'number' ? 'number' : 'text'}
                    value={row.value}
                    onChange={(event) => updateRow(row.id, (current) => ({ ...current, value: event.target.value }))}
                  />
                )}
                <Button
                  disabled={rows.length <= 1 || disabled}
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => onChangeRows(rows.filter((candidate) => candidate.id !== row.id))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={disabled}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => onChangeRows([...rows, createEmptyDraftRow()])}
            >
              Add entry
            </Button>
            <Button disabled={disabled} size="sm" type="button" variant="outline" onClick={() => onSave(rows)}>
              {saveButtonLabel}
            </Button>
            <Button disabled={disabled} size="sm" type="button" variant="ghost" onClick={onReset}>
              Reset
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button disabled={disabled} onClick={() => onOpenChange(false)} type="button" variant="outline">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
