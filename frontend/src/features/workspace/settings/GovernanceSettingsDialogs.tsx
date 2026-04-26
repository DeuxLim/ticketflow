import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type ProviderType = 'saml' | 'oidc';
type TenantMode = 'shared' | 'dedicated';

type Props = {
  isRetentionDialogOpen: boolean;
  onRetentionDialogOpenChange: (open: boolean) => void;
  ticketsDays: number;
  commentsDays: number;
  attachmentsDays: number;
  auditDays: number;
  setTicketsDaysDraft: (value: number) => void;
  setCommentsDaysDraft: (value: number) => void;
  setAttachmentsDaysDraft: (value: number) => void;
  setAuditDaysDraft: (value: number) => void;
  onSaveRetention: () => void;
  saveRetentionPending: boolean;
  saveRetentionError: string | null;

  isSecurityPolicyDialogOpen: boolean;
  onSecurityPolicyDialogOpenChange: (open: boolean) => void;
  requireSso: boolean;
  requireMfa: boolean;
  sessionTtl: number;
  tenantMode: TenantMode;
  dataPlaneKey: string;
  ipAllowlist: string;
  setRequireSsoDraft: (value: boolean) => void;
  setRequireMfaDraft: (value: boolean) => void;
  setSessionTtlDraft: (value: number) => void;
  setTenantModeDraft: (value: TenantMode) => void;
  setDataPlaneKeyDraft: (value: string) => void;
  setIpAllowlistDraft: (value: string) => void;
  onSaveSecurityPolicy: () => void;
  saveSecurityPolicyPending: boolean;
  saveSecurityPolicyError: string | null;

  isSlaDialogOpen: boolean;
  onSlaDialogOpenChange: (open: boolean) => void;
  slaName: string;
  slaPriority: Priority;
  slaFirstResponseMinutes: number;
  slaResolutionMinutes: number;
  setSlaName: (value: string) => void;
  setSlaPriority: (value: Priority) => void;
  setSlaFirstResponseMinutes: (value: number) => void;
  setSlaResolutionMinutes: (value: number) => void;
  onCreateSlaPolicy: () => void;
  createSlaPolicyPending: boolean;

  isBreakGlassDialogOpen: boolean;
  onBreakGlassDialogOpenChange: (open: boolean) => void;
  breakGlassReason: string;
  setBreakGlassReason: (value: string) => void;
  onRequestBreakGlass: () => void;
  requestBreakGlassPending: boolean;

  isProviderDialogOpen: boolean;
  onProviderDialogOpenChange: (open: boolean) => void;
  providerType: ProviderType;
  providerName: string;
  providerIssuer: string;
  providerSsoUrl: string;
  providerAuthUrl: string;
  providerTokenUrl: string;
  providerRedirectUrl: string;
  providerClientId: string;
  providerClientSecret: string;
  setProviderType: (value: ProviderType) => void;
  setProviderName: (value: string) => void;
  setProviderIssuer: (value: string) => void;
  setProviderSsoUrl: (value: string) => void;
  setProviderAuthUrl: (value: string) => void;
  setProviderTokenUrl: (value: string) => void;
  setProviderRedirectUrl: (value: string) => void;
  setProviderClientId: (value: string) => void;
  setProviderClientSecret: (value: string) => void;
  onCreateProvider: () => void;
  createProviderPending: boolean;

  isDirectoryDialogOpen: boolean;
  onDirectoryDialogOpenChange: (open: boolean) => void;
  directoryName: string;
  setDirectoryName: (value: string) => void;
  onCreateDirectory: () => void;
  createDirectoryPending: boolean;
};

export function GovernanceSettingsDialogs({
  isRetentionDialogOpen,
  onRetentionDialogOpenChange,
  ticketsDays,
  commentsDays,
  attachmentsDays,
  auditDays,
  setTicketsDaysDraft,
  setCommentsDaysDraft,
  setAttachmentsDaysDraft,
  setAuditDaysDraft,
  onSaveRetention,
  saveRetentionPending,
  saveRetentionError,
  isSecurityPolicyDialogOpen,
  onSecurityPolicyDialogOpenChange,
  requireSso,
  requireMfa,
  sessionTtl,
  tenantMode,
  dataPlaneKey,
  ipAllowlist,
  setRequireSsoDraft,
  setRequireMfaDraft,
  setSessionTtlDraft,
  setTenantModeDraft,
  setDataPlaneKeyDraft,
  setIpAllowlistDraft,
  onSaveSecurityPolicy,
  saveSecurityPolicyPending,
  saveSecurityPolicyError,
  isSlaDialogOpen,
  onSlaDialogOpenChange,
  slaName,
  slaPriority,
  slaFirstResponseMinutes,
  slaResolutionMinutes,
  setSlaName,
  setSlaPriority,
  setSlaFirstResponseMinutes,
  setSlaResolutionMinutes,
  onCreateSlaPolicy,
  createSlaPolicyPending,
  isBreakGlassDialogOpen,
  onBreakGlassDialogOpenChange,
  breakGlassReason,
  setBreakGlassReason,
  onRequestBreakGlass,
  requestBreakGlassPending,
  isProviderDialogOpen,
  onProviderDialogOpenChange,
  providerType,
  providerName,
  providerIssuer,
  providerSsoUrl,
  providerAuthUrl,
  providerTokenUrl,
  providerRedirectUrl,
  providerClientId,
  providerClientSecret,
  setProviderType,
  setProviderName,
  setProviderIssuer,
  setProviderSsoUrl,
  setProviderAuthUrl,
  setProviderTokenUrl,
  setProviderRedirectUrl,
  setProviderClientId,
  setProviderClientSecret,
  onCreateProvider,
  createProviderPending,
  isDirectoryDialogOpen,
  onDirectoryDialogOpenChange,
  directoryName,
  setDirectoryName,
  onCreateDirectory,
  createDirectoryPending,
}: Props) {
  return (
    <>
      <Dialog open={isRetentionDialogOpen} onOpenChange={onRetentionDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Retention Policy</DialogTitle>
            <DialogDescription>
              Set the number of days each compliance data category should remain available.
            </DialogDescription>
          </DialogHeader>
          <form
            id="retention-policy-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSaveRetention();
            }}
          >
            <FieldGroup>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="retention-tickets-days">Tickets (days)</FieldLabel>
                  <Input id="retention-tickets-days" type="number" value={ticketsDays} onChange={(event) => setTicketsDaysDraft(Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="retention-comments-days">Comments (days)</FieldLabel>
                  <Input id="retention-comments-days" type="number" value={commentsDays} onChange={(event) => setCommentsDaysDraft(Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="retention-attachments-days">Attachments (days)</FieldLabel>
                  <Input id="retention-attachments-days" type="number" value={attachmentsDays} onChange={(event) => setAttachmentsDaysDraft(Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="retention-audit-days">Audit (days)</FieldLabel>
                  <Input id="retention-audit-days" type="number" value={auditDays} onChange={(event) => setAuditDaysDraft(Number(event.target.value))} />
                </Field>
              </div>
            </FieldGroup>
            {saveRetentionError && (
              <p className="text-xs text-destructive">{saveRetentionError}</p>
            )}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onRetentionDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="retention-policy-form" disabled={saveRetentionPending}>
              {saveRetentionPending ? 'Saving...' : 'Save retention policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecurityPolicyDialogOpen} onOpenChange={onSecurityPolicyDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Security Policy</DialogTitle>
            <DialogDescription>
              Change workspace access requirements, tenant isolation mode, and trusted network restrictions.
            </DialogDescription>
          </DialogHeader>
          <form
            id="security-policy-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSaveSecurityPolicy();
            }}
          >
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
                <FieldLabel htmlFor="security-session-ttl">Session TTL (minutes)</FieldLabel>
                <Input id="security-session-ttl" type="number" value={sessionTtl} onChange={(event) => setSessionTtlDraft(Number(event.target.value))} />
                <FieldDescription>Controls how long authenticated workspace sessions remain valid.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Tenant mode</FieldLabel>
                <Select value={tenantMode} onValueChange={(value) => setTenantModeDraft((value as TenantMode) ?? 'shared')}>
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
                <FieldLabel htmlFor="security-data-plane-key">Dedicated data plane key</FieldLabel>
                <Input id="security-data-plane-key" value={dataPlaneKey} onChange={(event) => setDataPlaneKeyDraft(event.target.value)} />
                <FieldDescription>Leave blank unless this workspace has a dedicated data plane.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="security-ip-allowlist">IP allowlist (one IP per line)</FieldLabel>
                <Textarea id="security-ip-allowlist" rows={4} value={ipAllowlist} onChange={(event) => setIpAllowlistDraft(event.target.value)} />
              </Field>
            </FieldGroup>
            {saveSecurityPolicyError && (
              <p className="text-xs text-destructive">{saveSecurityPolicyError}</p>
            )}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onSecurityPolicyDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={saveSecurityPolicyPending} form="security-policy-form" type="submit">
              {saveSecurityPolicyPending ? 'Saving...' : 'Save security policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSlaDialogOpen} onOpenChange={onSlaDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SLA Policy</DialogTitle>
            <DialogDescription>
              Define the first-response and resolution targets for tickets with this priority.
            </DialogDescription>
          </DialogHeader>
          <form
            id="sla-policy-form"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateSlaPolicy();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sla-policy-name">Policy name</FieldLabel>
                <Input id="sla-policy-name" value={slaName} onChange={(event) => setSlaName(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select value={slaPriority} onValueChange={(value) => setSlaPriority((value as Priority) ?? 'high')}>
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
            <Button type="button" variant="outline" onClick={() => onSlaDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={createSlaPolicyPending || slaName.trim().length < 2}
              form="sla-policy-form"
              type="submit"
            >
              {createSlaPolicyPending ? 'Creating policy...' : 'Create SLA policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBreakGlassDialogOpen} onOpenChange={onBreakGlassDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Break-Glass Access</DialogTitle>
            <DialogDescription>
              Explain why emergency elevated access is required. Requests remain pending until approved.
            </DialogDescription>
          </DialogHeader>
          <form
            id="break-glass-form"
            onSubmit={(event) => {
              event.preventDefault();
              onRequestBreakGlass();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="break-glass-reason">Reason</FieldLabel>
                <Input id="break-glass-reason" value={breakGlassReason} onChange={(event) => setBreakGlassReason(event.target.value)} />
                <FieldDescription>Include the incident or ticket context for audit review.</FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onBreakGlassDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={requestBreakGlassPending} form="break-glass-form" type="submit">
              {requestBreakGlassPending ? 'Requesting...' : 'Request access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProviderDialogOpen} onOpenChange={onProviderDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Identity Provider</DialogTitle>
            <DialogDescription>
              Configure an OIDC or SAML provider for this workspace. Keep secrets available before saving.
            </DialogDescription>
          </DialogHeader>
          <form
            id="identity-provider-form"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateProvider();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Provider type</FieldLabel>
                <Select value={providerType} onValueChange={(value) => setProviderType((value as ProviderType) ?? 'oidc')}>
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
                    <Input id="identity-provider-client-secret" type="password" value={providerClientSecret} onChange={(event) => setProviderClientSecret(event.target.value)} />
                  </Field>
                </>
              )}
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onProviderDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={createProviderPending || providerName.trim().length < 2}
              form="identity-provider-form"
              type="submit"
            >
              {createProviderPending ? 'Creating provider...' : 'Create provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDirectoryDialogOpen} onOpenChange={onDirectoryDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SCIM Directory</DialogTitle>
            <DialogDescription>
              Create a provisioning directory and capture the one-time SCIM token immediately after creation.
            </DialogDescription>
          </DialogHeader>
          <form
            id="scim-directory-form"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateDirectory();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="scim-directory-name">Directory name</FieldLabel>
                <Input id="scim-directory-name" value={directoryName} onChange={(event) => setDirectoryName(event.target.value)} />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onDirectoryDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={createDirectoryPending || directoryName.trim().length < 2}
              form="scim-directory-form"
              type="submit"
            >
              {createDirectoryPending ? 'Creating directory...' : 'Create directory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
