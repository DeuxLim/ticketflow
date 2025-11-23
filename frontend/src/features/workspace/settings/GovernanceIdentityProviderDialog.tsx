import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ProviderType = 'saml' | 'oidc';

export function GovernanceIdentityProviderDialog({
  createProviderPending,
  isOpen,
  onCreateProvider,
  onOpenChange,
  providerAuthUrl,
  providerClientId,
  providerClientSecret,
  providerIssuer,
  providerName,
  providerRedirectUrl,
  providerSsoUrl,
  providerTokenUrl,
  providerType,
  setProviderAuthUrl,
  setProviderClientId,
  setProviderClientSecret,
  setProviderIssuer,
  setProviderName,
  setProviderRedirectUrl,
  setProviderSsoUrl,
  setProviderTokenUrl,
  setProviderType,
}: {
  createProviderPending: boolean;
  isOpen: boolean;
  onCreateProvider: () => void;
  onOpenChange: (open: boolean) => void;
  providerAuthUrl: string;
  providerClientId: string;
  providerClientSecret: string;
  providerIssuer: string;
  providerName: string;
  providerRedirectUrl: string;
  providerSsoUrl: string;
  providerTokenUrl: string;
  providerType: ProviderType;
  setProviderAuthUrl: (value: string) => void;
  setProviderClientId: (value: string) => void;
  setProviderClientSecret: (value: string) => void;
  setProviderIssuer: (value: string) => void;
  setProviderName: (value: string) => void;
  setProviderRedirectUrl: (value: string) => void;
  setProviderSsoUrl: (value: string) => void;
  setProviderTokenUrl: (value: string) => void;
  setProviderType: (value: ProviderType) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
  );
}
