import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
  tone?: 'default' | 'info' | 'warning' | 'success' | 'danger' | 'neutral';
};

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-card',
  info: 'bg-blue-50/60 ring-blue-100 dark:bg-blue-950/20 dark:ring-blue-900/30',
  warning: 'bg-amber-50/70 ring-amber-100 dark:bg-amber-950/20 dark:ring-amber-900/30',
  success: 'bg-emerald-50/60 ring-emerald-100 dark:bg-emerald-950/20 dark:ring-emerald-900/30',
  danger: 'bg-red-50/60 ring-red-100 dark:bg-red-950/20 dark:ring-red-900/30',
  neutral: 'bg-muted/35',
};

export function StatCard({ label, value, description, icon, tone = 'default' }: StatCardProps) {
  return (
    <Card className={cn('shadow-none ring-1 ring-transparent', toneClasses[tone])}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <CardTitle className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{value}</CardTitle>
        </div>
        {icon ? <div className="rounded-md border bg-background/80 p-2 text-muted-foreground">{icon}</div> : null}
      </CardHeader>
      {description ? (
        <CardContent>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
