import { Fragment } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type RowAction = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

export function RowActionMenu({ label, actions }: { label: string; actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        render={
          <Button size="icon-sm" type="button" variant="ghost">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{label}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action, index) => (
          <Fragment key={`${action.label}-${index}`}>
            {index > 0 && action.destructive ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              data-disabled={action.disabled ? '' : undefined}
              disabled={action.disabled}
              onClick={() => {
                if (!action.disabled) action.onSelect();
              }}
              variant={action.destructive ? 'destructive' : 'default'}
            >
              {action.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
