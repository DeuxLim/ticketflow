import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getGeneralSettings, updateGeneralSettings } from './settings-api';

type GeneralSettingsSectionProps = {
  workspaceSlug: string;
};

export function GeneralSettingsSection({ workspaceSlug }: GeneralSettingsSectionProps) {
  const queryClient = useQueryClient();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [timezoneDraft, setTimezoneDraft] = useState<string | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const [supportEmailDraft, setSupportEmailDraft] = useState<string | null>(null);
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'settings', 'general'],
    queryFn: () => getGeneralSettings(workspaceSlug),
  });

  const settings = settingsQuery.data?.data;
  const name = nameDraft ?? settings?.name ?? '';
  const timezone = timezoneDraft ?? settings?.timezone ?? 'UTC';
  const displayName = displayNameDraft ?? settings?.branding.display_name ?? '';
  const supportEmail = supportEmailDraft ?? settings?.branding.support_email ?? '';
  const summary = summaryDraft ?? settings?.business_profile.summary ?? '';

  const updateSettings = useMutation({
    mutationFn: () =>
      updateGeneralSettings(workspaceSlug, {
        name,
        timezone,
        branding: {
          display_name: displayName,
          support_email: supportEmail,
        },
        business_profile: {
          summary,
        },
      }),
    onSuccess: () => {
      setNameDraft(null);
      setTimezoneDraft(null);
      setDisplayNameDraft(null);
      setSupportEmailDraft(null);
      setSummaryDraft(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'settings', 'general'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', 'switcher'] });
    },
  });

  return (
    <Card className="shadow-none">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          General
        </Badge>
        <CardTitle>Workspace identity</CardTitle>
        <CardDescription>Set the operating identity owners see across the workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            updateSettings.mutate();
          }}
        >
          <FieldGroup>
            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
                <Input id="workspace-name" value={name} onChange={(event) => setNameDraft(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="workspace-timezone">Timezone</FieldLabel>
                <Input id="workspace-timezone" value={timezone} onChange={(event) => setTimezoneDraft(event.target.value)} />
                <FieldDescription>Use an IANA timezone such as Asia/Manila or UTC.</FieldDescription>
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="workspace-display-name">Display name</FieldLabel>
                <Input id="workspace-display-name" value={displayName} onChange={(event) => setDisplayNameDraft(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="workspace-support-email">Support email</FieldLabel>
                <Input id="workspace-support-email" type="email" value={supportEmail} onChange={(event) => setSupportEmailDraft(event.target.value)} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="workspace-summary">Business profile</FieldLabel>
              <Textarea
                id="workspace-summary"
                className="min-h-24"
                value={summary}
                onChange={(event) => setSummaryDraft(event.target.value)}
              />
              <FieldDescription>Short internal description used by admins and future governance workflows.</FieldDescription>
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {settingsQuery.isLoading ? 'Loading current settings...' : updateSettings.isError ? 'Save failed. Check the values and try again.' : 'Changes are audited.'}
            </p>
            <Button type="submit" disabled={updateSettings.isPending || settingsQuery.isLoading}>
              {updateSettings.isPending ? 'Saving...' : 'Save general settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
