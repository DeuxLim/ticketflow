import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatTicketDetailsDate, statusLabel, type ActivityLog } from '@/features/workspace/pages/ticketDetailsHelpers';
import type { Ticket, TicketCustomFieldValue } from '@/types/api';

type SlaSignal = {
  key: string;
  label: string;
  time: string | null;
  severity: 'warning' | 'info';
};

type TicketDetailsOverviewCardsProps = {
  ticket: Ticket;
  activityLogs: ActivityLog[];
  slaSignals: SlaSignal[];
  checklistCount: number;
  ticketLevelAttachmentCount: number;
  watcherCount: number;
  relatedTicketCount: number;
  onOpenChecklist: () => void;
  onOpenAttachments: () => void;
  onOpenWatchers: () => void;
  onOpenRelatedTickets: () => void;
};

export function TicketDetailsSummaryCard({ ticket }: { ticket: Ticket }) {
  const stateSummary = ticket.state_summary;

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Ticket Summary</CardTitle>
        <CardDescription>Customer, ownership, and workflow state.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm md:grid-cols-2">
        <DetailItem label="Customer" value={ticket.customer?.name ?? '—'} />
        <DetailItem label="Assignee" value={ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : 'Unassigned'} />
        <DetailItem label="Created by" value={fullName(ticket.creator)} />
        <DetailItem label="Queue" value={ticket.queue_key ?? '—'} />
        <DetailItem label="Category" value={ticket.category ?? '—'} />
        <DetailItem label="Assignment" value={statusLabel(stateSummary?.assignment.strategy)} />
        <DetailItem
          label="Approval"
          value={stateSummary?.approval.pending_count ? `${stateSummary.approval.pending_count} pending` : statusLabel(stateSummary?.approval.latest_status) === '—' ? 'No active approval' : statusLabel(stateSummary?.approval.latest_status)}
        />
        <DetailItem label="Automation" value={stateSummary?.automation.recent_count ? `${stateSummary.automation.recent_count} recent runs` : 'No recent runs'} />
        <DetailItem label="Tags" value={ticket.tags && ticket.tags.length > 0 ? ticket.tags.join(', ') : '—'} />
        <DetailItem label="Updated" value={formatTicketDetailsDate(ticket.updated_at)} />
      </CardContent>
    </Card>
  );
}

export function TicketActivityCard({ activityLogs }: { activityLogs: ActivityLog[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>State changes, automation, and assignment events in one running history.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {activityLogs.map((event) => (
          <div key={event.id} className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium">{humanizeAction(event.action)}</p>
            <p className="text-xs text-muted-foreground">{fullName(event.user)} • {formatTicketDetailsDate(event.created_at)}</p>
          </div>
        ))}
        {!activityLogs.length && <p className="text-sm text-muted-foreground">No activity yet.</p>}
      </CardContent>
    </Card>
  );
}

export function TicketSlaCard({ ticket, slaSignals }: { ticket: Ticket; slaSignals: SlaSignal[] }) {
  const stateSummary = ticket.state_summary;

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>SLA</CardTitle>
        <CardDescription>Response and resolution timing.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <Badge variant={stateSummary?.sla.status === 'breached' ? 'destructive' : 'secondary'} className="w-fit">
          {statusLabel(stateSummary?.sla.status)}
        </Badge>
        <DetailItem label="First response due" value={formatTicketDetailsDate(ticket.first_response_due_at)} />
        <DetailItem label="First responded" value={formatTicketDetailsDate(ticket.first_responded_at)} />
        <DetailItem label="Resolution due" value={formatTicketDetailsDate(ticket.resolution_due_at)} />
        <DetailItem label="Resolved at" value={formatTicketDetailsDate(ticket.resolved_at)} />
        <Separator />
        {slaSignals.map((signal) => (
          <p key={signal.key} className={signal.severity === 'warning' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
            {signal.label}{signal.time ? ` (${formatTicketDetailsDate(signal.time)})` : ''}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

export function TicketToolsCard({
  checklistCount,
  ticketLevelAttachmentCount,
  watcherCount,
  relatedTicketCount,
  onOpenChecklist,
  onOpenAttachments,
  onOpenWatchers,
  onOpenRelatedTickets,
}: Omit<TicketDetailsOverviewCardsProps, 'ticket' | 'activityLogs' | 'slaSignals'>) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Ticket Tools</CardTitle>
        <CardDescription>Open focused panels instead of stacking every operator task on the page.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="rounded-md border border-border p-3 text-sm">
          <p className="font-medium">Checklist</p>
          <p className="text-xs text-muted-foreground">{checklistCount} task{checklistCount === 1 ? '' : 's'} tracked</p>
        </div>
        <div className="rounded-md border border-border p-3 text-sm">
          <p className="font-medium">Attachments</p>
          <p className="text-xs text-muted-foreground">{ticketLevelAttachmentCount} ticket-level file{ticketLevelAttachmentCount === 1 ? '' : 's'}</p>
        </div>
        <div className="rounded-md border border-border p-3 text-sm">
          <p className="font-medium">Watchers</p>
          <p className="text-xs text-muted-foreground">{watcherCount} follower{watcherCount === 1 ? '' : 's'}</p>
        </div>
        <div className="rounded-md border border-border p-3 text-sm">
          <p className="font-medium">Related Tickets</p>
          <p className="text-xs text-muted-foreground">{relatedTicketCount} linked ticket{relatedTicketCount === 1 ? '' : 's'}</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={onOpenChecklist} size="sm" type="button" variant="outline">
            Open Checklist
          </Button>
          <Button onClick={onOpenAttachments} size="sm" type="button" variant="outline">
            Open Attachments
          </Button>
          <Button onClick={onOpenWatchers} size="sm" type="button" variant="outline">
            Open Watchers
          </Button>
          <Button onClick={onOpenRelatedTickets} size="sm" type="button" variant="outline">
            Open Related Tickets
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TicketCustomFieldsCard({ customFields }: { customFields: TicketCustomFieldValue[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Custom Fields</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {customFields.map((field) => (
          <DetailItem key={field.id} label={field.label ?? field.key ?? 'Field'} value={customFieldValue(field.value)} />
        ))}
        {!customFields.length && <p className="text-sm text-muted-foreground">No dynamic fields configured for this ticket.</p>}
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function fullName(person?: { first_name?: string; last_name?: string } | null): string {
  if (!person) return '—';
  return `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() || '—';
}

function humanizeAction(action: string): string {
  return action.replaceAll('.', ' ').replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function customFieldValue(value: TicketCustomFieldValue['value']): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
