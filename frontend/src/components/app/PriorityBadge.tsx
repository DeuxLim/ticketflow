import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const priorityClasses: Record<string, string> = {
  low: 'border-border bg-muted/40 text-muted-foreground',
  medium: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
  high: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  urgent: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
};

export function PriorityBadge({ priority, className }: { priority?: string | null; className?: string }) {
  const normalized = String(priority ?? 'none').toLowerCase();

  return (
    <Badge variant="outline" className={cn(priorityClasses[normalized] ?? 'border-border bg-muted/40 text-foreground', className)}>
      {normalized}
    </Badge>
  );
}
