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
          Webhook setup and delivery APIs were removed from this release. Add a new roadmap item before bringing integrations back.
        </p>
      </CardContent>
    </Card>
  );
}
