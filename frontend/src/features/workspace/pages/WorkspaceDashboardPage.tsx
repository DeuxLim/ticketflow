import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { ApiError, apiRequest } from '@/services/api/client';
import type { Customer, Ticket } from '@/types/api';

export function WorkspaceDashboardPage() {
  const { workspaceSlug } = useParams();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canViewCustomers = accessQuery.can('customers.view');
  const canViewTickets = accessQuery.can('tickets.view');

  const customersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'dashboard', 'customers'],
    queryFn: () => apiRequest<{ data: Customer[] }>(`/workspaces/${workspaceSlug}/customers`),
    enabled: Boolean(workspaceSlug && canViewCustomers),
  });

  const ticketsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'dashboard', 'tickets'],
    queryFn: () => apiRequest<{ data: Ticket[] }>(`/workspaces/${workspaceSlug}/tickets`),
    enabled: Boolean(workspaceSlug && canViewTickets),
  });

  if (accessQuery.isLoading || customersQuery.isLoading || ticketsQuery.isLoading) {
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

  if ((customersQuery.error instanceof ApiError && customersQuery.error.status === 403) || (ticketsQuery.error instanceof ApiError && ticketsQuery.error.status === 403)) {
    return (
      <ForbiddenState
        title="Overview unavailable"
        description="Your permissions changed and this summary is no longer available."
      />
    );
  }

  const customers = customersQuery.data?.data ?? [];
  const tickets = ticketsQuery.data?.data ?? [];
  const openCount = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length;
  const highPriorityCount = tickets.filter((ticket) => ticket.priority === 'high' || ticket.priority === 'urgent').length;
  const recentTickets = tickets.slice(0, 5);

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
        <MetricCard title="Customers" value={customers.length} description="Total customer records" />
        <MetricCard title="Tickets" value={tickets.length} description="All ticket records" />
        <MetricCard title="Open Work" value={openCount} description="Open + in progress tickets" />
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
            <Signal label="Open work" value={String(openCount)} />
            <Separator />
            <Signal label="High priority" value={String(highPriorityCount)} />
            <Separator />
            <Signal label="Tenant scope" value={workspaceSlug ?? '—'} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricCard({ title, value, description }: { title: string; value: number; description: string }) {
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
