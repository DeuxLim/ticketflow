import { Suspense, lazy, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ForbiddenState } from '@/components/forbidden-state';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { useParams } from 'react-router-dom';

const FormsSettingsSection = lazy(() =>
  import('../settings/FormsSettingsSection').then((module) => ({ default: module.FormsSettingsSection })),
);
const GeneralSettingsSection = lazy(() =>
  import('../settings/GeneralSettingsSection').then((module) => ({ default: module.GeneralSettingsSection })),
);
const GovernanceSettingsSection = lazy(() =>
  import('../settings/GovernanceSettingsSection').then((module) => ({ default: module.GovernanceSettingsSection })),
);
const IntegrationsSettingsSection = lazy(() =>
  import('../settings/IntegrationsSettingsSection').then((module) => ({ default: module.IntegrationsSettingsSection })),
);
const TicketingSettingsSection = lazy(() =>
  import('../settings/TicketingSettingsSection').then((module) => ({ default: module.TicketingSettingsSection })),
);
const WorkflowAutomationSettingsSection = lazy(() =>
  import('../settings/WorkflowAutomationSettingsSection').then((module) => ({ default: module.WorkflowAutomationSettingsSection })),
);

const settingsPermissions = ['workspace.manage', 'tickets.manage', 'security.manage', 'integrations.manage', 'automation.manage'];

export function WorkspaceSettingsPage() {
  const { workspaceSlug } = useParams();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canOpenSettings = settingsPermissions.some((permission) => accessQuery.can(permission));
  const availableTabs = {
    general: accessQuery.can('workspace.manage'),
    ticketing: accessQuery.can('tickets.manage'),
    forms: accessQuery.can('tickets.manage'),
    workflow: accessQuery.can('automation.manage') || accessQuery.can('tickets.manage'),
    security: accessQuery.can('security.manage'),
    integrations: accessQuery.can('integrations.manage'),
  };
  const [activeTab, setActiveTab] = useState<'general' | 'ticketing' | 'forms' | 'workflow' | 'security' | 'integrations'>('general');
  const fallbackTab = (Object.entries(availableTabs).find(([, enabled]) => enabled)?.[0] ?? 'ticketing') as
    | 'general'
    | 'ticketing'
    | 'forms'
    | 'workflow'
    | 'security'
    | 'integrations';
  const resolvedActiveTab = availableTabs[activeTab] ? activeTab : fallbackTab;

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

      <Tabs value={resolvedActiveTab} onValueChange={setActiveTab} className="flex flex-col gap-5">
        <TabsList variant="line" className="flex h-auto w-full flex-wrap justify-start gap-2">
          {availableTabs.general && <TabsTrigger value="general">General</TabsTrigger>}
          {availableTabs.ticketing && <TabsTrigger value="ticketing">Ticketing</TabsTrigger>}
          {availableTabs.forms && <TabsTrigger value="forms">Forms</TabsTrigger>}
          {availableTabs.workflow && <TabsTrigger value="workflow">Workflow & Automation</TabsTrigger>}
          {availableTabs.security && <TabsTrigger value="security">Security & Access</TabsTrigger>}
          {availableTabs.integrations && <TabsTrigger value="integrations">Integrations</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="flex-none">
          {resolvedActiveTab === 'general' ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading general settings...</p>}>
              <GeneralSettingsSection workspaceSlug={workspaceSlug} />
            </Suspense>
          ) : null}
        </TabsContent>
        <TabsContent value="ticketing" className="flex-none">
          {resolvedActiveTab === 'ticketing' ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading ticketing settings...</p>}>
              <TicketingSettingsSection workspaceSlug={workspaceSlug} />
            </Suspense>
          ) : null}
        </TabsContent>
        <TabsContent value="forms" className="flex-none">
          {resolvedActiveTab === 'forms' ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading form settings...</p>}>
              <FormsSettingsSection workspaceSlug={workspaceSlug} />
            </Suspense>
          ) : null}
        </TabsContent>
        <TabsContent value="workflow" className="flex-none">
          {resolvedActiveTab === 'workflow' ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading workflow settings...</p>}>
              <WorkflowAutomationSettingsSection workspaceSlug={workspaceSlug} />
            </Suspense>
          ) : null}
        </TabsContent>
        <TabsContent value="security" className="flex-none">
          {resolvedActiveTab === 'security' ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading security settings...</p>}>
              <GovernanceSettingsSection workspaceSlug={workspaceSlug} />
            </Suspense>
          ) : null}
        </TabsContent>
        <TabsContent value="integrations" className="flex-none">
          {resolvedActiveTab === 'integrations' ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading integrations...</p>}>
              <IntegrationsSettingsSection workspaceSlug={workspaceSlug} />
            </Suspense>
          ) : null}
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
