import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type TenantMode = 'shared' | 'dedicated';

export function SecurityPolicyDialog({
  dataPlaneKey,
  ipAllowlist,
  isOpen,
  onOpenChange,
  onSave,
  requireMfa,
  saveError,
  savePending,
  sessionTtl,
  setDataPlaneKeyDraft,
  setIpAllowlistDraft,
  setRequireMfaDraft,
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
  saveError: string | null;
  savePending: boolean;
  sessionTtl: number;
  setDataPlaneKeyDraft: (value: string) => void;
  setIpAllowlistDraft: (value: string) => void;
  setRequireMfaDraft: (value: boolean) => void;
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
            Change workspace access requirements, workspace mode, and trusted network restrictions.
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
            <div className="grid grid-cols-1 gap-3">
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
              <FieldLabel>Workspace mode</FieldLabel>
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
              <FieldLabel htmlFor="security-data-plane-key">Workspace mode key</FieldLabel>
              <Input id="security-data-plane-key" value={dataPlaneKey} onChange={(event) => setDataPlaneKeyDraft(event.target.value)} />
              <FieldDescription>Optional label for local/admin tracking. This does not provision separate infrastructure.</FieldDescription>
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
