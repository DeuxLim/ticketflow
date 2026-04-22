import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  approveBreakGlassRequest,
  createIdentityProvider,
  createProvisioningDirectory,
  createBreakGlassRequest,
  createExport,
  createSlaPolicy,
  downloadExport,
  deleteIdentityProvider,
  getTenantSecurityPolicy,
  getRetentionPolicy,
  listIdentityProviders,
  listAuditEvents,
  listBreakGlassRequests,
  listExports,
  listProvisioningDirectories,
  listSlaPolicies,
  startOidcSso,
  updateTenantSecurityPolicy,
  updateRetentionPolicy,
} from './settings-api';

type GovernanceSettingsSectionProps = {
  workspaceSlug: string;
};

export function GovernanceSettingsSection({ workspaceSlug }: GovernanceSettingsSectionProps) {
  const queryClient = useQueryClient();
  const retentionQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'retention-policy'], queryFn: () => getRetentionPolicy(workspaceSlug) });
  const slaPoliciesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'sla-policies'], queryFn: () => listSlaPolicies(workspaceSlug) });
  const exportsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'exports'], queryFn: () => listExports(workspaceSlug) });
  const breakGlassQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'break-glass'], queryFn: () => listBreakGlassRequests(workspaceSlug) });
  const auditQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'audit-events'], queryFn: () => listAuditEvents(workspaceSlug) });
  const securityPolicyQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'security-policy'], queryFn: () => getTenantSecurityPolicy(workspaceSlug) });
  const identityProvidersQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'identity-providers'], queryFn: () => listIdentityProviders(workspaceSlug) });
  const provisioningDirectoriesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'provisioning-directories'], queryFn: () => listProvisioningDirectories(workspaceSlug) });

  const [ticketsDaysDraft, setTicketsDaysDraft] = useState<number | null>(null);
  const [commentsDaysDraft, setCommentsDaysDraft] = useState<number | null>(null);
  const [attachmentsDaysDraft, setAttachmentsDaysDraft] = useState<number | null>(null);
  const [auditDaysDraft, setAuditDaysDraft] = useState<number | null>(null);
  const [isBreakGlassDialogOpen, setIsBreakGlassDialogOpen] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState('Urgent production access for incident response.');
  const [isSlaDialogOpen, setIsSlaDialogOpen] = useState(false);
  const [slaName, setSlaName] = useState('Default SLA');
  const [slaPriority, setSlaPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [slaFirstResponseMinutes, setSlaFirstResponseMinutes] = useState(30);
  const [slaResolutionMinutes, setSlaResolutionMinutes] = useState(240);
  const [requireSsoDraft, setRequireSsoDraft] = useState<boolean | null>(null);
  const [requireMfaDraft, setRequireMfaDraft] = useState<boolean | null>(null);
  const [sessionTtlDraft, setSessionTtlDraft] = useState<number | null>(null);
  const [tenantModeDraft, setTenantModeDraft] = useState<'shared' | 'dedicated' | null>(null);
  const [dataPlaneKeyDraft, setDataPlaneKeyDraft] = useState<string | null>(null);
  const [ipAllowlistDraft, setIpAllowlistDraft] = useState<string | null>(null);

  const [providerType, setProviderType] = useState<'saml' | 'oidc'>('oidc');
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [providerIssuer, setProviderIssuer] = useState('');
  const [providerSsoUrl, setProviderSsoUrl] = useState('');
  const [providerAuthUrl, setProviderAuthUrl] = useState('');
  const [providerTokenUrl, setProviderTokenUrl] = useState('');
  const [providerRedirectUrl, setProviderRedirectUrl] = useState('');
  const [providerClientId, setProviderClientId] = useState('');
  const [providerClientSecret, setProviderClientSecret] = useState('');
  const [lastOidcUrl, setLastOidcUrl] = useState<string | null>(null);
  const [isDirectoryDialogOpen, setIsDirectoryDialogOpen] = useState(false);
  const [directoryName, setDirectoryName] = useState('');
  const [lastScimToken, setLastScimToken] = useState<string | null>(null);

  const policy = retentionQuery.data?.data;
  const securityPolicy = securityPolicyQuery.data?.data;
  const providers = identityProvidersQuery.data?.data ?? [];
  const directories = provisioningDirectoriesQuery.data?.data ?? [];
  const ticketsDays = ticketsDaysDraft ?? policy?.tickets_days ?? 365;
  const commentsDays = commentsDaysDraft ?? policy?.comments_days ?? 365;
  const attachmentsDays = attachmentsDaysDraft ?? policy?.attachments_days ?? 365;
  const auditDays = auditDaysDraft ?? policy?.audit_days ?? 730;
  const requireSso = requireSsoDraft ?? securityPolicy?.require_sso ?? false;
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
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'retention-policy'] });
    },
  });

  const requestExport = useMutation({
    mutationFn: () => createExport(workspaceSlug, ['tickets', 'comments', 'attachments', 'audit']),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'exports'] }),
  });

  const requestBreakGlass = useMutation({
    mutationFn: () => createBreakGlassRequest(workspaceSlug, breakGlassReason, 60),
    onSuccess: () => {
      setIsBreakGlassDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'break-glass'] });
    },
  });

  const approveBreakGlass = useMutation({
    mutationFn: (id: number) => approveBreakGlassRequest(workspaceSlug, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'break-glass'] }),
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
      setSlaName('Default SLA');
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
        require_sso: requireSso,
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
      setRequireSsoDraft(null);
      setRequireMfaDraft(null);
      setSessionTtlDraft(null);
      setTenantModeDraft(null);
      setDataPlaneKeyDraft(null);
      setIpAllowlistDraft(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'security-policy'] });
    },
  });

  const createProvider = useMutation({
    mutationFn: () =>
      createIdentityProvider(workspaceSlug, {
        provider_type: providerType,
        name: providerName.trim(),
        issuer: providerIssuer.trim() || null,
        sso_url: providerSsoUrl.trim() || null,
        authorization_url: providerAuthUrl.trim() || null,
        token_url: providerTokenUrl.trim() || null,
        redirect_uri: providerRedirectUrl.trim() || null,
        client_id: providerClientId.trim() || null,
        client_secret: providerClientSecret.trim() || null,
        is_active: true,
      }),
    onSuccess: () => {
      setProviderName('');
      setProviderIssuer('');
      setProviderSsoUrl('');
      setProviderAuthUrl('');
      setProviderTokenUrl('');
      setProviderRedirectUrl('');
      setProviderClientId('');
      setProviderClientSecret('');
      setIsProviderDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'identity-providers'] });
    },
  });

  const removeProvider = useMutation({
    mutationFn: (providerId: number) => deleteIdentityProvider(workspaceSlug, providerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'identity-providers'] }),
  });

  const startOidc = useMutation({
    mutationFn: (providerId: number) => startOidcSso(workspaceSlug, providerId),
    onSuccess: (response) => setLastOidcUrl(response.data.authorization_url),
  });

  const createDirectory = useMutation({
    mutationFn: () => createProvisioningDirectory(workspaceSlug, directoryName.trim()),
    onSuccess: (response) => {
      setDirectoryName('');
      setIsDirectoryDialogOpen(false);
      setLastScimToken(response.meta?.token ?? null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'provisioning-directories'] });
    },
  });

  const exports = exportsQuery.data?.data ?? [];
  const slaPolicies = slaPoliciesQuery.data?.data ?? [];
  const breakGlass = breakGlassQuery.data?.data ?? [];
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
                <div key={item.id} className="flex items-center justify-between gap-2 rounded border p-2">
                  <p>{item.status} • #{item.id} • {new Date(item.created_at).toLocaleString()}</p>
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
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-md border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">SLA policies</p>
                <p className="text-xs text-muted-foreground">Review response targets before creating another policy.</p>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => setIsSlaDialogOpen(true)}>
                Create SLA policy
              </Button>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {slaPolicies.slice(0, 6).map((policy) => (
                <p key={policy.id}>
                  {policy.name} • {policy.priority} • first response {policy.first_response_minutes}m • resolution {policy.resolution_minutes}m
                </p>
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
          <div className="flex flex-col gap-3 rounded-md border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Break-glass requests</p>
                <p className="text-xs text-muted-foreground">Request emergency access only for time-sensitive incidents.</p>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => setIsBreakGlassDialogOpen(true)}>
                Request access
              </Button>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {breakGlass.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded border p-2">
                  <p>{item.status} • #{item.id} • {new Date(item.created_at).toLocaleString()}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={item.status !== 'pending' || approveBreakGlass.isPending}
                    onClick={() => approveBreakGlass.mutate(item.id)}
                  >
                    {approveBreakGlass.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
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

      <Card className="shadow-none xl:col-span-2">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">Security</Badge>
          <CardTitle>Access policy and identity</CardTitle>
          <CardDescription>Manage workspace access guardrails, SSO providers, and SCIM provisioning directories.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-md border p-3">
            <p className="text-sm font-medium">Tenant security policy</p>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
                  <Checkbox checked={requireSso} onCheckedChange={(checked) => setRequireSsoDraft(checked === true)} />
                  <span>Require SSO</span>
                </label>
                <label className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
                  <Checkbox checked={requireMfa} onCheckedChange={(checked) => setRequireMfaDraft(checked === true)} />
                  <span>Require MFA</span>
                </label>
              </div>
              <Field>
                <FieldLabel>Session TTL (minutes)</FieldLabel>
                <Input type="number" value={sessionTtl} onChange={(event) => setSessionTtlDraft(Number(event.target.value))} />
              </Field>
              <Field>
                <FieldLabel>Tenant mode</FieldLabel>
                <Select value={tenantMode} onValueChange={(value) => setTenantModeDraft((value as 'shared' | 'dedicated') ?? 'shared')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="shared">shared</SelectItem>
                      <SelectItem value="dedicated">dedicated</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Dedicated data plane key</FieldLabel>
                <Input value={dataPlaneKey} onChange={(event) => setDataPlaneKeyDraft(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel>IP allowlist (one IP per line)</FieldLabel>
                <Textarea rows={4} value={ipAllowlist} onChange={(event) => setIpAllowlistDraft(event.target.value)} />
              </Field>
            </FieldGroup>
            {saveSecurityPolicy.isError && (
              <p className="text-xs text-destructive">{(saveSecurityPolicy.error as Error).message}</p>
            )}
            <Button size="sm" variant="outline" disabled={saveSecurityPolicy.isPending} onClick={() => saveSecurityPolicy.mutate()}>
              {saveSecurityPolicy.isPending ? 'Saving...' : 'Save security policy'}
            </Button>
          </div>

          <div className="space-y-4 rounded-md border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Identity providers</p>
                <p className="text-xs text-muted-foreground">Review configured SSO endpoints before adding another provider.</p>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => setIsProviderDialogOpen(true)}>
                Add provider
              </Button>
            </div>
            <div className="space-y-2 text-xs">
              {providers.map((provider) => (
                <div key={provider.id} className="rounded border p-2">
                  <p className="font-medium">{provider.name} ({provider.provider_type})</p>
                  <p className="text-muted-foreground">{provider.issuer ?? provider.authorization_url ?? provider.sso_url ?? 'no endpoint configured'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {provider.provider_type === 'oidc' && (
                      <Button size="sm" variant="outline" onClick={() => startOidc.mutate(provider.id)}>
                        Start OIDC
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => removeProvider.mutate(provider.id)} disabled={removeProvider.isPending}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {lastOidcUrl && (
              <a className="text-xs underline" href={lastOidcUrl} rel="noreferrer" target="_blank">
                Open latest OIDC authorization URL
              </a>
            )}
          </div>

          <div className="space-y-4 rounded-md border p-3 lg:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">SCIM provisioning directories</p>
                <p className="text-xs text-muted-foreground">Create directories only when you are ready to store the one-time SCIM token.</p>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => setIsDirectoryDialogOpen(true)}>
                Create directory
              </Button>
            </div>
            {lastScimToken && (
              <p className="rounded border p-2 text-xs text-muted-foreground">
                Latest SCIM token (shown once): {lastScimToken}
              </p>
            )}
            <div className="space-y-2 text-xs">
              {directories.map((directory) => (
                <p key={directory.id}>
                  {directory.name} • {directory.status} • {new Date(directory.created_at).toLocaleString()}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
      <Dialog open={isSlaDialogOpen} onOpenChange={setIsSlaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SLA Policy</DialogTitle>
            <DialogDescription>
              Define the first-response and resolution targets for tickets with this priority.
            </DialogDescription>
          </DialogHeader>
          <form id="sla-policy-form" onSubmit={(event) => {
            event.preventDefault();
            createSlaPolicyMutation.mutate();
          }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sla-policy-name">Policy name</FieldLabel>
                <Input id="sla-policy-name" value={slaName} onChange={(event) => setSlaName(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select value={slaPriority} onValueChange={(value) => setSlaPriority((value as 'low' | 'medium' | 'high' | 'urgent') ?? 'high')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="low">low</SelectItem>
                      <SelectItem value="medium">medium</SelectItem>
                      <SelectItem value="high">high</SelectItem>
                      <SelectItem value="urgent">urgent</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sla-first-response">First response (minutes)</FieldLabel>
                  <Input
                    id="sla-first-response"
                    type="number"
                    value={slaFirstResponseMinutes}
                    onChange={(event) => setSlaFirstResponseMinutes(Number(event.target.value) || 0)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sla-resolution">Resolution (minutes)</FieldLabel>
                  <Input
                    id="sla-resolution"
                    type="number"
                    value={slaResolutionMinutes}
                    onChange={(event) => setSlaResolutionMinutes(Number(event.target.value) || 0)}
                  />
                </Field>
              </div>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSlaDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createSlaPolicyMutation.isPending || slaName.trim().length < 2}
              form="sla-policy-form"
              type="submit"
            >
              {createSlaPolicyMutation.isPending ? 'Creating policy...' : 'Create SLA policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBreakGlassDialogOpen} onOpenChange={setIsBreakGlassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Break-Glass Access</DialogTitle>
            <DialogDescription>
              Explain why emergency elevated access is required. Requests remain pending until approved.
            </DialogDescription>
          </DialogHeader>
          <form id="break-glass-form" onSubmit={(event) => {
            event.preventDefault();
            requestBreakGlass.mutate();
          }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="break-glass-reason">Reason</FieldLabel>
                <Input id="break-glass-reason" value={breakGlassReason} onChange={(event) => setBreakGlassReason(event.target.value)} />
                <FieldDescription>Include the incident or ticket context for audit review.</FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsBreakGlassDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={requestBreakGlass.isPending} form="break-glass-form" type="submit">
              {requestBreakGlass.isPending ? 'Requesting...' : 'Request access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Identity Provider</DialogTitle>
            <DialogDescription>
              Configure an OIDC or SAML provider for this workspace. Keep secrets available before saving.
            </DialogDescription>
          </DialogHeader>
          <form id="identity-provider-form" onSubmit={(event) => {
            event.preventDefault();
            createProvider.mutate();
          }}>
            <FieldGroup>
              <Field>
                <FieldLabel>Provider type</FieldLabel>
                <Select value={providerType} onValueChange={(value) => setProviderType((value as 'saml' | 'oidc') ?? 'oidc')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="oidc">OIDC</SelectItem>
                      <SelectItem value="saml">SAML</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="identity-provider-name">Name</FieldLabel>
                <Input id="identity-provider-name" value={providerName} onChange={(event) => setProviderName(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="identity-provider-issuer">Issuer</FieldLabel>
                <Input id="identity-provider-issuer" value={providerIssuer} onChange={(event) => setProviderIssuer(event.target.value)} />
              </Field>
              {providerType === 'saml' ? (
                <Field>
                  <FieldLabel htmlFor="identity-provider-saml-url">SAML SSO URL</FieldLabel>
                  <Input id="identity-provider-saml-url" value={providerSsoUrl} onChange={(event) => setProviderSsoUrl(event.target.value)} />
                </Field>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="identity-provider-auth-url">Authorization URL</FieldLabel>
                    <Input id="identity-provider-auth-url" value={providerAuthUrl} onChange={(event) => setProviderAuthUrl(event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="identity-provider-token-url">Token URL</FieldLabel>
                    <Input id="identity-provider-token-url" value={providerTokenUrl} onChange={(event) => setProviderTokenUrl(event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="identity-provider-redirect-uri">Redirect URI</FieldLabel>
                    <Input id="identity-provider-redirect-uri" value={providerRedirectUrl} onChange={(event) => setProviderRedirectUrl(event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="identity-provider-client-id">Client ID</FieldLabel>
                    <Input id="identity-provider-client-id" value={providerClientId} onChange={(event) => setProviderClientId(event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="identity-provider-client-secret">Client secret</FieldLabel>
                    <Input
                      id="identity-provider-client-secret"
                      type="password"
                      value={providerClientSecret}
                      onChange={(event) => setProviderClientSecret(event.target.value)}
                    />
                  </Field>
                </>
              )}
              {createProvider.isError && (
                <p className="text-xs text-destructive">{(createProvider.error as Error).message}</p>
              )}
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsProviderDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!providerName.trim() || createProvider.isPending}
              form="identity-provider-form"
              type="submit"
            >
              {createProvider.isPending ? 'Creating...' : 'Create provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDirectoryDialogOpen} onOpenChange={setIsDirectoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SCIM Directory</DialogTitle>
            <DialogDescription>
              Name the provisioning directory. The SCIM token is shown once after creation.
            </DialogDescription>
          </DialogHeader>
          <form id="scim-directory-form" onSubmit={(event) => {
            event.preventDefault();
            createDirectory.mutate();
          }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="directory-name">Directory name</FieldLabel>
                <Input id="directory-name" value={directoryName} onChange={(event) => setDirectoryName(event.target.value)} />
                <FieldDescription>Use the identity source name, for example Azure AD or Okta.</FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDirectoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!directoryName.trim() || createDirectory.isPending}
              form="scim-directory-form"
              type="submit"
            >
              {createDirectory.isPending ? 'Creating...' : 'Create directory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
