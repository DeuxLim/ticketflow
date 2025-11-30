import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { GovernanceSettingsDialogs } from './GovernanceSettingsDialogs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createExport,
  createSlaPolicy,
  downloadExport,
  getTenantSecurityPolicy,
  getRetentionPolicy,
  listAuditEvents,
  listExports,
  listSlaPolicies,
  updateTenantSecurityPolicy,
  updateRetentionPolicy,
} from '@/features/workspace/api/settings-api';

type GovernanceSettingsSectionProps = {
  workspaceSlug: string;
};

export function GovernanceSettingsSection({ workspaceSlug }: GovernanceSettingsSectionProps) {
  const queryClient = useQueryClient();
  const retentionQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'retention-policy'], queryFn: () => getRetentionPolicy(workspaceSlug) });
  const slaPoliciesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'sla-policies'], queryFn: () => listSlaPolicies(workspaceSlug) });
  const exportsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'exports'], queryFn: () => listExports(workspaceSlug) });
  const auditQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'audit-events'], queryFn: () => listAuditEvents(workspaceSlug) });
  const securityPolicyQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'security-policy'], queryFn: () => getTenantSecurityPolicy(workspaceSlug) });

  const [ticketsDaysDraft, setTicketsDaysDraft] = useState<number | null>(null);
  const [commentsDaysDraft, setCommentsDaysDraft] = useState<number | null>(null);
  const [attachmentsDaysDraft, setAttachmentsDaysDraft] = useState<number | null>(null);
  const [auditDaysDraft, setAuditDaysDraft] = useState<number | null>(null);
  const [isRetentionDialogOpen, setIsRetentionDialogOpen] = useState(false);
  const [isSlaDialogOpen, setIsSlaDialogOpen] = useState(false);
  const [slaName, setSlaName] = useState('Default timing target');
  const [slaPriority, setSlaPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [slaFirstResponseMinutes, setSlaFirstResponseMinutes] = useState(30);
  const [slaResolutionMinutes, setSlaResolutionMinutes] = useState(240);
  const [requireMfaDraft, setRequireMfaDraft] = useState<boolean | null>(null);
  const [sessionTtlDraft, setSessionTtlDraft] = useState<number | null>(null);
  const [tenantModeDraft, setTenantModeDraft] = useState<'shared' | 'dedicated' | null>(null);
  const [dataPlaneKeyDraft, setDataPlaneKeyDraft] = useState<string | null>(null);
  const [ipAllowlistDraft, setIpAllowlistDraft] = useState<string | null>(null);
  const [isSecurityPolicyDialogOpen, setIsSecurityPolicyDialogOpen] = useState(false);

  const policy = retentionQuery.data?.data;
  const securityPolicy = securityPolicyQuery.data?.data;
  const ticketsDays = ticketsDaysDraft ?? policy?.tickets_days ?? 365;
  const commentsDays = commentsDaysDraft ?? policy?.comments_days ?? 365;
  const attachmentsDays = attachmentsDaysDraft ?? policy?.attachments_days ?? 365;
  const auditDays = auditDaysDraft ?? policy?.audit_days ?? 730;
  const requireMfa = requireMfaDraft ?? securityPolicy?.require_mfa ?? false;
  const sessionTtl = sessionTtlDraft ?? securityPolicy?.session_ttl_minutes ?? 720;
  const tenantMode = tenantModeDraft ?? securityPolicy?.tenant_mode ?? 'shared';
  const dataPlaneKey = dataPlaneKeyDraft ?? securityPolicy?.dedicated_data_plane_key ?? '';
  const ipAllowlist = ipAllowlistDraft ?? (securityPolicy?.ip_allowlist ?? []).join('\n');

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
      setIsRetentionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'retention-policy'] });
    },
  });

  const requestExport = useMutation({
    mutationFn: () => createExport(workspaceSlug, ['tickets', 'comments', 'attachments', 'audit']),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'exports'] }),
  });

  const createSlaPolicyMutation = useMutation({
    mutationFn: () =>
      createSlaPolicy(workspaceSlug, {
        name: slaName.trim(),
        priority: slaPriority,
        first_response_minutes: slaFirstResponseMinutes,
        resolution_minutes: slaResolutionMinutes,
        is_active: true,
      }),
    onSuccess: () => {
      setSlaName('Default timing target');
      setSlaPriority('high');
      setSlaFirstResponseMinutes(30);
      setSlaResolutionMinutes(240);
      setIsSlaDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'sla-policies'] });
    },
  });

  const saveSecurityPolicy = useMutation({
    mutationFn: () =>
      updateTenantSecurityPolicy(workspaceSlug, {
        require_mfa: requireMfa,
        session_ttl_minutes: sessionTtl,
        tenant_mode: tenantMode,
        dedicated_data_plane_key: dataPlaneKey.trim() || null,
        ip_allowlist: ipAllowlist
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      setRequireMfaDraft(null);
      setSessionTtlDraft(null);
      setTenantModeDraft(null);
      setDataPlaneKeyDraft(null);
      setIpAllowlistDraft(null);
      setIsSecurityPolicyDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'security-policy'] });
    },
  });

  const exports = exportsQuery.data?.data ?? [];
  const slaPolicies = slaPoliciesQuery.data?.data ?? [];
  const audits = auditQuery.data?.data ?? [];

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Governance</Badge>
            <CardTitle>Retention and export</CardTitle>
            <CardDescription>Define retention windows and generate tenant-scoped compliance exports.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-md border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Retention policy</p>
                  <p className="text-xs text-muted-foreground">Review how long workspace data is retained before changing policy windows.</p>
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => setIsRetentionDialogOpen(true)}>
                  Edit retention
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <PolicyMetric label="Tickets" value={`${ticketsDays} days`} />
                <PolicyMetric label="Comments" value={`${commentsDays} days`} />
                <PolicyMetric label="Attachments" value={`${attachmentsDays} days`} />
                <PolicyMetric label="Audit" value={`${auditDays} days`} />
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Tenant exports</p>
                <Button size="sm" variant="outline" onClick={() => requestExport.mutate()}>Create export</Button>
              </div>
              <div className="mt-3 flex flex-col gap-2 text-xs">
                {exports.length === 0 ? (
                  <p className="text-muted-foreground">No exports requested yet.</p>
                ) : (
                  exports.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded border p-2">
                      <p>{item.status} - #{item.id} - {new Date(item.created_at).toLocaleString()}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!item.download_token}
                        onClick={() => {
                          if (!item.download_token) return;
                          void downloadExport(workspaceSlug, item.id, item.download_token);
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-md border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Ticket timing targets</p>
                  <p className="text-xs text-muted-foreground">
                    Optional targets that show when a first reply or resolution is due.
                  </p>
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => setIsSlaDialogOpen(true)}>
                  Add target
                </Button>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                {slaPolicies.length === 0 ? (
                  <p className="text-muted-foreground">No timing targets configured.</p>
                ) : (
                  slaPolicies.slice(0, 6).map((policy) => (
                    <p key={policy.id}>
                      {policy.name} - {policy.priority} - first reply target {policy.first_response_minutes}m - resolution target {policy.resolution_minutes}m
                    </p>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Audit</CardTitle>
            <CardDescription>Inspect recent privileged actions in this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Recent privileged audit events</p>
              <div className="mt-2 flex flex-col gap-2 text-xs">
                {audits.length === 0 ? (
                  <p className="text-muted-foreground">No privileged audit events yet.</p>
                ) : (
                  audits.slice(0, 8).map((event) => (
                    <p key={event.id}>
                      {event.action} - {event.resource_type}#{event.resource_id ?? 'n/a'}
                    </p>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none xl:col-span-2">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Security</Badge>
            <CardTitle>Access policy</CardTitle>
            <CardDescription>Manage workspace access guardrails and trusted network restrictions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 rounded-md border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Tenant security policy</p>
                  <p className="text-xs text-muted-foreground">Review active access guardrails before changing enforcement rules.</p>
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => setIsSecurityPolicyDialogOpen(true)}>
                  Edit policy
                </Button>
              </div>
              <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <PolicyMetric label="MFA required" value={requireMfa ? 'Yes' : 'No'} />
                <PolicyMetric label="Session TTL" value={`${sessionTtl} minutes`} />
                <PolicyMetric label="Tenant mode" value={tenantMode} />
                <PolicyMetric label="IP allowlist" value={ipAllowlist.trim() ? `${ipAllowlist.split('\n').filter(Boolean).length} entries` : 'No restrictions'} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <GovernanceSettingsDialogs
        isRetentionDialogOpen={isRetentionDialogOpen}
        onRetentionDialogOpenChange={setIsRetentionDialogOpen}
        ticketsDays={ticketsDays}
        commentsDays={commentsDays}
        attachmentsDays={attachmentsDays}
        auditDays={auditDays}
        setTicketsDaysDraft={setTicketsDaysDraft}
        setCommentsDaysDraft={setCommentsDaysDraft}
        setAttachmentsDaysDraft={setAttachmentsDaysDraft}
        setAuditDaysDraft={setAuditDaysDraft}
        onSaveRetention={() => saveRetention.mutate()}
        saveRetentionPending={saveRetention.isPending}
        saveRetentionError={saveRetention.isError ? (saveRetention.error as Error).message : null}
        isSecurityPolicyDialogOpen={isSecurityPolicyDialogOpen}
        onSecurityPolicyDialogOpenChange={setIsSecurityPolicyDialogOpen}
        requireMfa={requireMfa}
        sessionTtl={sessionTtl}
        tenantMode={tenantMode}
        dataPlaneKey={dataPlaneKey}
        ipAllowlist={ipAllowlist}
        setRequireMfaDraft={setRequireMfaDraft}
        setSessionTtlDraft={setSessionTtlDraft}
        setTenantModeDraft={setTenantModeDraft}
        setDataPlaneKeyDraft={setDataPlaneKeyDraft}
        setIpAllowlistDraft={setIpAllowlistDraft}
        onSaveSecurityPolicy={() => saveSecurityPolicy.mutate()}
        saveSecurityPolicyPending={saveSecurityPolicy.isPending}
        saveSecurityPolicyError={saveSecurityPolicy.isError ? (saveSecurityPolicy.error as Error).message : null}
        isSlaDialogOpen={isSlaDialogOpen}
        onSlaDialogOpenChange={setIsSlaDialogOpen}
        slaName={slaName}
        slaPriority={slaPriority}
        slaFirstResponseMinutes={slaFirstResponseMinutes}
        slaResolutionMinutes={slaResolutionMinutes}
        setSlaName={setSlaName}
        setSlaPriority={setSlaPriority}
        setSlaFirstResponseMinutes={setSlaFirstResponseMinutes}
        setSlaResolutionMinutes={setSlaResolutionMinutes}
        onCreateSlaPolicy={() => createSlaPolicyMutation.mutate()}
        createSlaPolicyPending={createSlaPolicyMutation.isPending}
      />
    </>
  );
}

function PolicyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
