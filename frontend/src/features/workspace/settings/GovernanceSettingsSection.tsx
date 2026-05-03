import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { GovernanceSettingsDialogs } from './GovernanceSettingsDialogs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createSlaPolicy,
  getTenantSecurityPolicy,
  listAuditEvents,
  listSlaPolicies,
  updateTenantSecurityPolicy,
} from '@/features/workspace/api/settings-api';

type GovernanceSettingsSectionProps = {
  workspaceSlug: string;
};

export function GovernanceSettingsSection({ workspaceSlug }: GovernanceSettingsSectionProps) {
  const queryClient = useQueryClient();
  const slaPoliciesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'sla-policies'], queryFn: () => listSlaPolicies(workspaceSlug) });
  const auditQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'audit-events'], queryFn: () => listAuditEvents(workspaceSlug) });
  const securityPolicyQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'security-policy'], queryFn: () => getTenantSecurityPolicy(workspaceSlug) });

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

  const securityPolicy = securityPolicyQuery.data?.data;
  const requireMfa = requireMfaDraft ?? securityPolicy?.require_mfa ?? false;
  const sessionTtl = sessionTtlDraft ?? securityPolicy?.session_ttl_minutes ?? 720;
  const tenantMode = tenantModeDraft ?? securityPolicy?.tenant_mode ?? 'shared';
  const dataPlaneKey = dataPlaneKeyDraft ?? securityPolicy?.dedicated_data_plane_key ?? '';
  const ipAllowlist = ipAllowlistDraft ?? (securityPolicy?.ip_allowlist ?? []).join('\n');

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

  const slaPolicies = slaPoliciesQuery.data?.data ?? [];
  const audits = auditQuery.data?.data ?? [];

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Governance</Badge>
            <CardTitle>Ticket timing</CardTitle>
            <CardDescription>Review optional ticket timing targets.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
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
