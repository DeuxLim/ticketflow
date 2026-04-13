import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  createBreakGlassRequest,
  createExport,
  getRetentionPolicy,
  listAuditEvents,
  listBreakGlassRequests,
  listExports,
  updateRetentionPolicy,
} from './settings-api';

type GovernanceSettingsSectionProps = {
  workspaceSlug: string;
};

export function GovernanceSettingsSection({ workspaceSlug }: GovernanceSettingsSectionProps) {
  const queryClient = useQueryClient();
  const retentionQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'retention-policy'], queryFn: () => getRetentionPolicy(workspaceSlug) });
  const exportsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'exports'], queryFn: () => listExports(workspaceSlug) });
  const breakGlassQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'break-glass'], queryFn: () => listBreakGlassRequests(workspaceSlug) });
  const auditQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'audit-events'], queryFn: () => listAuditEvents(workspaceSlug) });

  const [ticketsDaysDraft, setTicketsDaysDraft] = useState<number | null>(null);
  const [commentsDaysDraft, setCommentsDaysDraft] = useState<number | null>(null);
  const [attachmentsDaysDraft, setAttachmentsDaysDraft] = useState<number | null>(null);
  const [auditDaysDraft, setAuditDaysDraft] = useState<number | null>(null);
  const [breakGlassReason, setBreakGlassReason] = useState('Urgent production access for incident response.');

  const policy = retentionQuery.data?.data;
  const ticketsDays = ticketsDaysDraft ?? policy?.tickets_days ?? 365;
  const commentsDays = commentsDaysDraft ?? policy?.comments_days ?? 365;
  const attachmentsDays = attachmentsDaysDraft ?? policy?.attachments_days ?? 365;
  const auditDays = auditDaysDraft ?? policy?.audit_days ?? 730;

  const saveRetention = useMutation({
    mutationFn: () =>
      updateRetentionPolicy(workspaceSlug, {
        tickets_days: ticketsDays,
        comments_days: commentsDays,
        attachments_days: attachmentsDays,
        audit_days: auditDays,
      }),
    onSuccess: () => {
      setTicketsDaysDraft(null);
      setCommentsDaysDraft(null);
      setAttachmentsDaysDraft(null);
      setAuditDaysDraft(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'retention-policy'] });
    },
  });

  const requestExport = useMutation({
    mutationFn: () => createExport(workspaceSlug, ['tickets', 'comments', 'attachments', 'audit']),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'exports'] }),
  });

  const requestBreakGlass = useMutation({
    mutationFn: () => createBreakGlassRequest(workspaceSlug, breakGlassReason, 60),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'break-glass'] }),
  });

  const exports = exportsQuery.data?.data ?? [];
  const breakGlass = breakGlassQuery.data?.data ?? [];
  const audits = auditQuery.data?.data ?? [];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">Governance</Badge>
          <CardTitle>Retention and export</CardTitle>
          <CardDescription>Define retention windows and generate tenant-scoped compliance exports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveRetention.mutate();
            }}
          >
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Tickets (days)</FieldLabel>
                  <Input type="number" value={ticketsDays} onChange={(event) => setTicketsDaysDraft(Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel>Comments (days)</FieldLabel>
                  <Input type="number" value={commentsDays} onChange={(event) => setCommentsDaysDraft(Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel>Attachments (days)</FieldLabel>
                  <Input type="number" value={attachmentsDays} onChange={(event) => setAttachmentsDaysDraft(Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel>Audit (days)</FieldLabel>
                  <Input type="number" value={auditDays} onChange={(event) => setAuditDaysDraft(Number(event.target.value))} />
                </Field>
              </div>
            </FieldGroup>
            <Button type="submit" disabled={saveRetention.isPending}>{saveRetention.isPending ? 'Saving...' : 'Save retention policy'}</Button>
          </form>

          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Tenant exports</p>
              <Button size="sm" variant="outline" onClick={() => requestExport.mutate()}>Create export</Button>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {exports.slice(0, 5).map((item) => (
                <p key={item.id}>{item.status} • #{item.id} • {new Date(item.created_at).toLocaleString()}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Break-glass and audit</CardTitle>
          <CardDescription>Request emergency elevated access and inspect privileged actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">Break-glass requests</p>
            <Input className="mt-2" value={breakGlassReason} onChange={(event) => setBreakGlassReason(event.target.value)} />
            <Button className="mt-2" size="sm" variant="outline" onClick={() => requestBreakGlass.mutate()}>
              Request break-glass access
            </Button>
            <div className="mt-3 space-y-2 text-xs">
              {breakGlass.slice(0, 5).map((item) => (
                <p key={item.id}>{item.status} • #{item.id} • {new Date(item.created_at).toLocaleString()}</p>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">Recent privileged audit events</p>
            <div className="mt-2 space-y-2 text-xs">
              {audits.slice(0, 8).map((event) => (
                <p key={event.id}>
                  {event.action} • {event.resource_type}#{event.resource_id ?? 'n/a'}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
