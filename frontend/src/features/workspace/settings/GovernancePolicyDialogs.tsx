import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type TenantMode = 'shared' | 'dedicated';

export function RetentionPolicyDialog({
  auditDays,
  attachmentsDays,
  commentsDays,
  isOpen,
  onOpenChange,
  onSave,
  saveError,
  savePending,
  setAttachmentsDaysDraft,
  setAuditDaysDraft,
  setCommentsDaysDraft,
  setTicketsDaysDraft,
  ticketsDays,
}: {
  auditDays: number;
  attachmentsDays: number;
  commentsDays: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  saveError: string | null;
  savePending: boolean;
  setAttachmentsDaysDraft: (value: number) => void;
  setAuditDaysDraft: (value: number) => void;
  setCommentsDaysDraft: (value: number) => void;
  setTicketsDaysDraft: (value: number) => void;
  ticketsDays: number;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            onSave();
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
          {saveError ? <p className="text-xs text-destructive">{saveError}</p> : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="retention-policy-form" disabled={savePending}>
            {savePending ? 'Saving...' : 'Save retention policy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SecurityPolicyDialog({
  dataPlaneKey,
  ipAllowlist,
  isOpen,
  onOpenChange,
  onSave,
  requireMfa,
  requireSso,
  saveError,
  savePending,
  sessionTtl,
  setDataPlaneKeyDraft,
  setIpAllowlistDraft,
  setRequireMfaDraft,
  setRequireSsoDraft,
  setSessionTtlDraft,
  setTenantModeDraft,
  tenantMode,
}: {
  dataPlaneKey: string;
  ipAllowlist: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  requireMfa: boolean;
  requireSso: boolean;
  saveError: string | null;
  savePending: boolean;
  sessionTtl: number;
  setDataPlaneKeyDraft: (value: string) => void;
  setIpAllowlistDraft: (value: string) => void;
  setRequireMfaDraft: (value: boolean) => void;
  setRequireSsoDraft: (value: boolean) => void;
  setSessionTtlDraft: (value: number) => void;
  setTenantModeDraft: (value: TenantMode) => void;
  tenantMode: TenantMode;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            onSave();
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
          {saveError ? <p className="text-xs text-destructive">{saveError}</p> : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={savePending} form="security-policy-form" type="submit">
            {savePending ? 'Saving...' : 'Save security policy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
