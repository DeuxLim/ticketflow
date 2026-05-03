import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type IntegrationsSettingsSectionProps = {
  workspaceSlug: string;
};

export function IntegrationsSettingsSection({ workspaceSlug }: IntegrationsSettingsSectionProps) {
  void workspaceSlug;

  return (
    <Card className="shadow-none">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">Integrations</Badge>
        <CardTitle>Integrations deferred</CardTitle>
        <CardDescription>
          Webhook delivery is outside the current medium-ticketing scope.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The backend webhook endpoints are kept dormant for a later product decision, but webhook setup is hidden from this version of the app.
        </p>
      </CardContent>
    </Card>
  );
}
