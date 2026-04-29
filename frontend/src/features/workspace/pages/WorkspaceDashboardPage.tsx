import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import {
  getDashboardReportingOverview,
  listDashboardCustomers,
  listDashboardRecentTickets,
} from '@/features/workspace/api/workspaceDashboardApi';
import { ApiError } from '@/services/api/client';

export function WorkspaceDashboardPage() {
  const { workspaceSlug } = useParams();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canViewCustomers = accessQuery.can('customers.view');
  const canViewTickets = accessQuery.can('tickets.view');
  const canViewReporting = accessQuery.can('reporting.view');

  const customersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'dashboard', 'customers'],
    queryFn: () => listDashboardCustomers(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canViewCustomers),
  });

  const recentTicketsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'dashboard', 'tickets'],
    queryFn: () => listDashboardRecentTickets(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canViewTickets),
  });

  const reportingQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'dashboard', 'reporting-overview'],
    queryFn: () => getDashboardReportingOverview(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canViewReporting),
  });

  if (accessQuery.isLoading || customersQuery.isLoading || recentTicketsQuery.isLoading || reportingQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (!canViewCustomers && !canViewTickets) {
    return (
      <ForbiddenState
        title="Overview unavailable"
        description="You need at least one view permission to access workspace metrics."
      />
    );
  }

  if ((customersQuery.error instanceof ApiError && customersQuery.error.status === 403) || (recentTicketsQuery.error instanceof ApiError && recentTicketsQuery.error.status === 403)) {
    return (
      <ForbiddenState
        title="Overview unavailable"
        description="Your permissions changed and this summary is no longer available."
      />
    );
  }

  const customersTotal = customersQuery.data?.meta?.total ?? 0;
  const ticketsTotal = reportingQuery.data?.data.totals.tickets ?? recentTicketsQuery.data?.meta?.total ?? 0;
  const openCount = reportingQuery.data?.data.totals.open ?? null;
  const backlog = reportingQuery.data?.data.backlog_by_priority;
  const highPriorityCount = backlog
    ? (backlog.high ?? 0) + (backlog.urgent ?? 0)
    : null;
  const recentTickets = recentTicketsQuery.data?.data ?? [];

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary">Workspace</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Operations Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">Current work, queue health, and tenant scope.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard title="Customers" value={customersTotal} description="Total customer records" />
        <MetricCard title="Tickets" value={ticketsTotal} description="All ticket records" />
        <MetricCard title="Open Work" value={openCount === null ? '—' : openCount} description="Open + in progress tickets" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="shadow-none">
          <CardHeader className="border-b">
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Latest work from this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentTickets.length ? (
              <div className="divide-y">
                {recentTickets.map((ticket) => (
                  <Link
                    className="grid gap-3 p-4 transition-colors hover:bg-muted/50 md:grid-cols-[1fr_auto]"
                    key={ticket.id}
                    to={`/workspaces/${workspaceSlug}/tickets/${ticket.id}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ticket.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ticket.ticket_number} · {ticket.customer?.name ?? 'No customer'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{ticket.status.replace('_', ' ')}</Badge>
                      <Badge variant="secondary">{ticket.priority}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">No tickets yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Queue Health</CardTitle>
            <CardDescription>Signals that need attention.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Signal label="Open work" value={openCount === null ? '—' : String(openCount)} />
            <Separator />
            <Signal label="High priority" value={highPriorityCount === null ? '—' : String(highPriorityCount)} />
            <Separator />
            <Signal label="Tenant scope" value={workspaceSlug ?? '—'} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricCard({ title, value, description }: { title: string; value: number | string; description: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-medium">{value}</p>
    </div>
  );
}
