import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type TicketQueueSearchBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  savedViewName: string | null;
  activeFilterCount: number;
  selectedVisibleTicketIdsCount: number;
  activeFilterLabels: string[];
  onResetControls: () => void;
};

export function TicketQueueSearchBar({
  search,
  onSearchChange,
  savedViewName,
  activeFilterCount,
  selectedVisibleTicketIdsCount,
  activeFilterLabels,
  onResetControls,
}: TicketQueueSearchBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field className="min-w-[240px] flex-1">
        <FieldLabel htmlFor="ticket-search">Search</FieldLabel>
        <Input
          id="ticket-search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Ticket number, title, or description…"
          value={search}
        />
        <FieldDescription>Use search for quick narrowing, then open "Views & Filters" for deeper queue controls.</FieldDescription>
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        {savedViewName && (
          <Badge variant="outline">
            Saved view: {savedViewName}
          </Badge>
        )}
        {activeFilterCount > 0 && <Badge variant="outline">{activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}</Badge>}
        {activeFilterLabels.slice(0, 3).map((label) => (
          <Badge key={label} variant="secondary">{label}</Badge>
        ))}
        {activeFilterLabels.length > 3 && <Badge variant="secondary">+{activeFilterLabels.length - 3} more</Badge>}
        {selectedVisibleTicketIdsCount > 0 && (
          <Badge variant="secondary">{selectedVisibleTicketIdsCount} selected</Badge>
        )}
        {(activeFilterCount > 0 || savedViewName) && (
          <Button onClick={onResetControls} size="sm" type="button" variant="outline">
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
