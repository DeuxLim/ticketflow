import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ForbiddenState } from '@/components/forbidden-state';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { useParams } from 'react-router-dom';
import { FormsSettingsSection } from '../settings/FormsSettingsSection';
import { GeneralSettingsSection } from '../settings/GeneralSettingsSection';
import { GovernanceSettingsSection } from '../settings/GovernanceSettingsSection';
import { IntegrationsSettingsSection } from '../settings/IntegrationsSettingsSection';
import { TicketingSettingsSection } from '../settings/TicketingSettingsSection';
import { WorkflowAutomationSettingsSection } from '../settings/WorkflowAutomationSettingsSection';

const settingsPermissions = ['workspace.manage', 'tickets.manage', 'security.manage', 'integrations.manage', 'automation.manage'];

export function WorkspaceSettingsPage() {
  const { workspaceSlug } = useParams();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canOpenSettings = settingsPermissions.some((permission) => accessQuery.can(permission));

  if (accessQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Checking settings access...</p>;
  }

  if (!workspaceSlug || !canOpenSettings) {
    return (
      <ForbiddenState
        title="Settings unavailable"
        description="You need a workspace, ticketing, automation, security, or integrations management permission to open settings."
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="secondary">Owner configuration</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Workspace Settings</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Configure workspace identity, ticket dictionaries, forms, security, automation, and integrations.
          </p>
        </div>
      </div>

      <Tabs defaultValue={accessQuery.can('workspace.manage') ? 'general' : 'ticketing'} className="flex flex-col gap-5">
        <TabsList variant="line" className="flex h-auto w-full flex-wrap justify-start gap-2">
          {accessQuery.can('workspace.manage') && <TabsTrigger value="general">General</TabsTrigger>}
          {accessQuery.can('tickets.manage') && <TabsTrigger value="ticketing">Ticketing</TabsTrigger>}
          {accessQuery.can('tickets.manage') && <TabsTrigger value="forms">Forms</TabsTrigger>}
          {(accessQuery.can('automation.manage') || accessQuery.can('tickets.manage')) && (
            <TabsTrigger value="workflow">Workflow & Automation</TabsTrigger>
          )}
          {accessQuery.can('security.manage') && <TabsTrigger value="security">Security & Access</TabsTrigger>}
          {accessQuery.can('integrations.manage') && <TabsTrigger value="integrations">Integrations</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="flex-none">
          <GeneralSettingsSection workspaceSlug={workspaceSlug} />
        </TabsContent>
        <TabsContent value="ticketing" className="flex-none">
          <TicketingSettingsSection workspaceSlug={workspaceSlug} />
        </TabsContent>
        <TabsContent value="forms" className="flex-none">
          <FormsSettingsSection workspaceSlug={workspaceSlug} />
        </TabsContent>
        <TabsContent value="workflow" className="flex-none">
          <WorkflowAutomationSettingsSection workspaceSlug={workspaceSlug} />
        </TabsContent>
        <TabsContent value="security" className="flex-none">
          <GovernanceSettingsSection workspaceSlug={workspaceSlug} />
        </TabsContent>
        <TabsContent value="integrations" className="flex-none">
          <IntegrationsSettingsSection workspaceSlug={workspaceSlug} />
        </TabsContent>
      </Tabs>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Rollout note</CardTitle>
          <CardDescription>
            Ticket create/edit screens stay backward-compatible while enterprise controls are progressively enabled tenant by tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use feature flags and workspace-level rollout to gradually apply stricter workflow, automation, and governance policies.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
