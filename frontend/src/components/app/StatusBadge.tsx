import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusClasses: Record<string, string> = {
  open: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
  active: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
  pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
  closed: 'border-border bg-muted text-muted-foreground',
  inactive: 'border-border bg-muted text-muted-foreground',
  suspended: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
};

export function StatusBadge({ status, label, className }: { status?: string | null; label?: string; className?: string }) {
  const normalized = String(status ?? 'unknown').toLowerCase();

  return (
    <Badge variant="outline" className={cn(statusClasses[normalized] ?? 'border-border bg-muted/40 text-foreground', className)}>
      {label ?? normalized.replaceAll('_', ' ')}
    </Badge>
  );
}
