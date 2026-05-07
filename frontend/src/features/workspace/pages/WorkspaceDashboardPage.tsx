import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader, PriorityBadge, StatCard, StatusBadge } from '@/components/app';
import { ForbiddenState } from '@/components/forbidden-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import {
  getDashboardReportingOverview,
  listDashboardCustomers,
  listDashboardRecentTickets,
} from '@/features/workspace/api/workspaceDashboardApi';
import { ticketStatusLabel } from '@/features/workspace/pages/ticketForm';
import { ApiError } from '@/services/api/client';
import { AlertCircle, CheckCircle2, Clock3, Inbox, Ticket, Users } from 'lucide-react';

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
  const resolvedCount = reportingQuery.data?.data.totals.resolved ?? null;
  const backlog = reportingQuery.data?.data.backlog_by_priority;
  const highPriorityCount = backlog
    ? (backlog.high ?? 0) + (backlog.urgent ?? 0)
    : null;
  const recentTickets = recentTicketsQuery.data?.data ?? [];

  return (
    <section className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Workspace"
        title="Operations Overview"
        description="Current work, queue health, and tenant scope."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Customers" value={customersTotal} description="Total customer records" icon={<Users className="size-4" />} />
        <StatCard label="Tickets" value={ticketsTotal} description="All ticket records" icon={<Ticket className="size-4" />} />
        <StatCard label="Open Work" value={openCount === null ? '—' : openCount} description="Open and in-progress tickets" icon={<Inbox className="size-4" />} tone="info" />
        <StatCard label="Resolved" value={resolvedCount === null ? '—' : resolvedCount} description="Tickets completed in the current reporting view" icon={<CheckCircle2 className="size-4" />} tone="success" />
        <StatCard label="High Priority" value={highPriorityCount === null ? '—' : highPriorityCount} description="High and urgent backlog items" icon={<AlertCircle className="size-4" />} tone="warning" />
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
                      <StatusBadge status={ticket.status} label={ticketStatusLabel(ticket.status)} />
                      <PriorityBadge priority={ticket.priority} />
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
            <Signal label="Resolved" value={resolvedCount === null ? '—' : String(resolvedCount)} />
            <Separator />
            <Signal label="Tenant scope" value={workspaceSlug ?? '—'} />
            <Separator />
            <Signal label="Data source" value="Live workspace APIs" icon={<Clock3 className="size-4" />} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Signal({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</p>
      <p className="mt-1 truncate text-lg font-medium">{value}</p>
    </div>
  );
}
