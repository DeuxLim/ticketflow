import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminWorkspaceEditorDialog,
} from '@/features/admin/pages/AdminWorkspaceEditorDialog';
import {
  buildWorkspaceEditorMutationErrorMessage,
  createDraftRows,
  parseDraftRows,
  type DraftRow,
  type WorkspaceEditorKind,
} from '@/features/admin/pages/adminWorkspaceEditorHelpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/services/api/client';
import type {
  AdminDashboardStats,
  AdminUser,
  AdminWorkspace,
  ApiEnvelope,
  ApiPaginationMeta,
} from '@/types/api';

type PaginatedEnvelope<T> = {
  data: T[];
  meta: ApiPaginationMeta;
};

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [limitsDrafts, setLimitsDrafts] = useState<Record<number, DraftRow[]>>({});
  const [featureFlagDrafts, setFeatureFlagDrafts] = useState<Record<number, DraftRow[]>>({});
  const [limitsErrors, setLimitsErrors] = useState<Record<number, string | null>>({});
  const [featureFlagErrors, setFeatureFlagErrors] = useState<Record<number, string | null>>({});
  const [workspaceEditor, setWorkspaceEditor] = useState<{
    workspace: AdminWorkspace;
    kind: WorkspaceEditorKind;
  } | null>(null);

  const usersPath = useMemo(
    () => `/admin/users?per_page=20&search=${encodeURIComponent(userSearch.trim())}`,
    [userSearch],
  );
  const workspacesPath = useMemo(
    () => `/admin/workspaces?per_page=20&search=${encodeURIComponent(workspaceSearch.trim())}`,
    [workspaceSearch],
  );

  const statsQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiRequest<ApiEnvelope<AdminDashboardStats>>('/admin/dashboard'),
  });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', userSearch],
    queryFn: () => apiRequest<PaginatedEnvelope<AdminUser>>(usersPath),
  });

  const workspacesQuery = useQuery({
    queryKey: ['admin', 'workspaces', workspaceSearch],
    queryFn: () => apiRequest<PaginatedEnvelope<AdminWorkspace>>(workspacesPath),
  });

  const openWorkspaceEditor = (workspace: AdminWorkspace, kind: WorkspaceEditorKind) => {
    if (kind === 'limits') {
      setLimitsDrafts((previous) => ({
        ...previous,
        [workspace.id]: previous[workspace.id] ?? createDraftRows(workspace.usage_limits),
      }));
      setLimitsErrors((previous) => ({ ...previous, [workspace.id]: null }));
    } else {
      setFeatureFlagDrafts((previous) => ({
        ...previous,
        [workspace.id]: previous[workspace.id] ?? createDraftRows(workspace.feature_flags),
      }));
      setFeatureFlagErrors((previous) => ({ ...previous, [workspace.id]: null }));
    }

    setWorkspaceEditor({ workspace, kind });
  };

  const suspendWorkspace = useMutation({
    mutationFn: (workspace: AdminWorkspace) =>
      apiRequest(`/admin/workspaces/${workspace.slug}/suspend`, {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Suspended from platform control plane',
          confirmed: true,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    },
  });

  const reactivateWorkspace = useMutation({
    mutationFn: (workspace: AdminWorkspace) =>
      apiRequest(`/admin/workspaces/${workspace.slug}/reactivate`, {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Reactivated from platform control plane',
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    },
  });

  const toggleMaintenance = useMutation({
    mutationFn: (workspace: AdminWorkspace) =>
      apiRequest(`/admin/workspaces/${workspace.slug}/isolation`, {
        method: 'PATCH',
        body: JSON.stringify({
          tenant_mode: workspace.tenant_mode,
          dedicated_data_plane_key: workspace.tenant_mode === 'dedicated' ? 'dp-enterprise' : null,
          maintenance_mode: !workspace.maintenance_mode,
          reason: 'Maintenance mode toggle from admin console',
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    },
  });

  const toggleIsolation = useMutation({
    mutationFn: (workspace: AdminWorkspace) =>
      apiRequest(`/admin/workspaces/${workspace.slug}/isolation`, {
        method: 'PATCH',
        body: JSON.stringify({
          tenant_mode: workspace.tenant_mode === 'shared' ? 'dedicated' : 'shared',
          dedicated_data_plane_key: workspace.tenant_mode === 'shared' ? `dp-${workspace.slug}` : null,
          maintenance_mode: workspace.maintenance_mode,
          reason: 'Isolation mode toggle from admin console',
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    },
  });

  const updateWorkspaceLimits = useMutation({
    mutationFn: ({ workspace, limits }: { workspace: AdminWorkspace; limits: Record<string, unknown> }) =>
      apiRequest(`/admin/workspaces/${workspace.slug}/limits`, {
        method: 'PATCH',
        body: JSON.stringify({ limits }),
      }),
    onSuccess: (_, variables) => {
      setLimitsDrafts((previous) => {
        const next = { ...previous };
        delete next[variables.workspace.id];
        return next;
      });
      setLimitsErrors((previous) => ({ ...previous, [variables.workspace.id]: null }));
      setWorkspaceEditor(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    },
    onError: (error, variables) => {
      setLimitsErrors((previous) => ({
        ...previous,
        [variables.workspace.id]: buildWorkspaceEditorMutationErrorMessage(error, 'Unable to update workspace limits.'),
      }));
    },
  });

  const updateWorkspaceFeatureFlags = useMutation({
    mutationFn: ({ workspace, featureFlags }: { workspace: AdminWorkspace; featureFlags: Record<string, unknown> }) =>
      apiRequest(`/admin/workspaces/${workspace.slug}/feature-flags`, {
        method: 'PATCH',
        body: JSON.stringify({ feature_flags: featureFlags }),
      }),
    onSuccess: (_, variables) => {
      setFeatureFlagDrafts((previous) => {
        const next = { ...previous };
        delete next[variables.workspace.id];
        return next;
      });
      setFeatureFlagErrors((previous) => ({ ...previous, [variables.workspace.id]: null }));
      setWorkspaceEditor(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    },
    onError: (error, variables) => {
      setFeatureFlagErrors((previous) => ({
        ...previous,
        [variables.workspace.id]: buildWorkspaceEditorMutationErrorMessage(error, 'Unable to update feature flags.'),
      }));
    },
  });

  if (statsQuery.isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Platform metrics unavailable</CardTitle>
          <CardDescription>Refresh the page or try again after the API is reachable.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stats = statsQuery.data.data;
  const users = usersQuery.data?.data ?? [];
  const usersMeta = usersQuery.data?.meta;
  const workspaces = workspacesQuery.data?.data ?? [];
  const workspacesMeta = workspacesQuery.data?.meta;
  const workspaceActionPending =
    suspendWorkspace.isPending ||
    reactivateWorkspace.isPending ||
    toggleMaintenance.isPending ||
    toggleIsolation.isPending ||
    updateWorkspaceLimits.isPending ||
    updateWorkspaceFeatureFlags.isPending;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Platform
        </Badge>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Control plane</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Monitor tenants, users, isolation mode, and platform-wide operational risk.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Updated from live admin APIs</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <AdminMetric title="Users" value={stats.users_count} description="Registered accounts" />
        <AdminMetric title="Workspaces" value={stats.workspaces_count} description="Tenant workspaces" />
        <AdminMetric title="Memberships" value={stats.memberships_count} description="User-workspace links" />
        <AdminMetric title="Tickets" value={stats.tickets_count} description="System-wide tickets" />
        <AdminMetric title="Suspended" value={stats.suspended_workspaces_count} description="Suspended tenants" />
        <AdminMetric title="Maintenance" value={stats.maintenance_workspaces_count} description="Workspaces in maintenance mode" />
        <AdminMetric title="Dedicated" value={stats.dedicated_workspaces_count} description="Dedicated isolation tenants" />
        <AdminMetric title="Stale IdP Certs" value={stats.stale_idp_certificates_count} description="Expires within 30 days" />
        <AdminMetric title="Automation Failures" value={stats.failed_automation_executions_count} description="Failed rule executions" />
        <AdminMetric title="Break-Glass Pending" value={stats.pending_break_glass_count} description="Dual-control pending" />
      </div>

      <Separator />

      <Tabs defaultValue="workspaces" className="flex flex-col gap-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces" className="mt-0">
          <Card className="shadow-none">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle>Workspaces</CardTitle>
                  <CardDescription>{workspacesMeta?.total ?? 0} tenant records</CardDescription>
                </div>
                <FieldGroup className="w-full md:max-w-sm">
                  <Field>
                    <FieldLabel htmlFor="workspace-search">Search workspaces</FieldLabel>
                    <Input
                      id="workspace-search"
                      onChange={(event) => setWorkspaceSearch(event.target.value)}
                      placeholder="Name or slug"
                      value={workspaceSearch}
                    />
                  </Field>
                </FieldGroup>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {workspacesQuery.isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading workspaces...</p>
              ) : workspacesQuery.isError ? (
                <p className="p-4 text-sm text-destructive">Unable to load workspaces.</p>
              ) : workspaces.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No workspaces found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[1040px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workspace</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workspaces.map((workspace) => (
                        <TableRow key={workspace.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <p className="font-medium">{workspace.name}</p>
                              <p className="text-xs text-muted-foreground">{workspace.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {workspace.owner ? (
                              <div className="flex flex-col gap-1">
                                <p className="text-sm">
                                  {workspace.owner.first_name} {workspace.owner.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">{workspace.owner.email}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>{workspace.memberships_count}</TableCell>
                          <TableCell>{workspace.tickets_count}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant={workspace.tenant_mode === 'dedicated' ? 'default' : 'secondary'}>
                                {workspace.tenant_mode}
                              </Badge>
                              {workspace.maintenance_mode && <Badge variant="outline">maintenance</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={workspace.lifecycle_status === 'active' ? 'secondary' : 'destructive'}>
                              {workspace.lifecycle_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(workspace.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex flex-wrap justify-end gap-2">
                                {workspace.lifecycle_status === 'active' ? (
                                  <Button
                                    disabled={workspaceActionPending}
                                    onClick={() => suspendWorkspace.mutate(workspace)}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    disabled={workspaceActionPending}
                                    onClick={() => reactivateWorkspace.mutate(workspace)}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    Reactivate
                                  </Button>
                                )}
                                <Button
                                  disabled={workspaceActionPending}
                                  onClick={() => toggleMaintenance.mutate(workspace)}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  {workspace.maintenance_mode ? 'Disable maintenance' : 'Enable maintenance'}
                                </Button>
                                <Button
                                  disabled={workspaceActionPending}
                                  onClick={() => toggleIsolation.mutate(workspace)}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  {workspace.tenant_mode === 'shared' ? 'Move to dedicated' : 'Move to shared'}
                                </Button>
                              </div>

                              <div className="flex flex-col items-end gap-2 rounded-md border border-border/70 bg-muted/20 p-2">
                                <p className="text-xs text-muted-foreground">
                                  {Object.keys(workspace.usage_limits ?? {}).length} limits /{' '}
                                  {Object.keys(workspace.feature_flags ?? {}).length} flags
                                </p>
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button
                                    disabled={workspaceActionPending}
                                    onClick={() => openWorkspaceEditor(workspace, 'limits')}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    Manage limits
                                  </Button>
                                  <Button
                                    disabled={workspaceActionPending}
                                    onClick={() => openWorkspaceEditor(workspace, 'featureFlags')}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    Manage feature flags
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <Card className="shadow-none">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle>Users</CardTitle>
                  <CardDescription>{usersMeta?.total ?? 0} platform accounts</CardDescription>
                </div>
                <FieldGroup className="w-full md:max-w-sm">
                  <Field>
                    <FieldLabel htmlFor="user-search">Search users</FieldLabel>
                    <Input
                      id="user-search"
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Name, username, or email"
                      value={userSearch}
                    />
                  </Field>
                </FieldGroup>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {usersQuery.isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading users...</p>
              ) : usersQuery.isError ? (
                <p className="p-4 text-sm text-destructive">Unable to load users.</p>
              ) : users.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            {user.is_platform_admin ? (
                              <Badge>Platform admin</Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AdminWorkspaceEditorDialog
        open={workspaceEditor?.kind === 'limits'}
        workspace={workspaceEditor?.kind === 'limits' ? workspaceEditor.workspace : null}
        kind="limits"
        rows={workspaceEditor?.kind === 'limits' ? (limitsDrafts[workspaceEditor.workspace.id] ?? createDraftRows(workspaceEditor.workspace.usage_limits)) : []}
        errorMessage={workspaceEditor?.kind === 'limits' ? (limitsErrors[workspaceEditor.workspace.id] ?? null) : null}
        disabled={workspaceActionPending}
        onOpenChange={(open) => !open && setWorkspaceEditor(null)}
        onChangeRows={(rows) => {
          if (workspaceEditor?.kind !== 'limits') return;
          setLimitsDrafts((previous) => ({ ...previous, [workspaceEditor.workspace.id]: rows }));
          setLimitsErrors((previous) => ({ ...previous, [workspaceEditor.workspace.id]: null }));
        }}
        onReset={() => {
          if (workspaceEditor?.kind !== 'limits') return;
          setLimitsDrafts((previous) => ({
            ...previous,
            [workspaceEditor.workspace.id]: createDraftRows(workspaceEditor.workspace.usage_limits),
          }));
          setLimitsErrors((previous) => ({ ...previous, [workspaceEditor.workspace.id]: null }));
        }}
        onSave={(rows) => {
          if (workspaceEditor?.kind !== 'limits') return;
          const parsed = parseDraftRows(rows);
          if (!parsed.data) {
            setLimitsErrors((previous) => ({
              ...previous,
              [workspaceEditor.workspace.id]: parsed.error ?? 'Unable to parse limits values.',
            }));
            return;
          }

          updateWorkspaceLimits.mutate({ workspace: workspaceEditor.workspace, limits: parsed.data });
        }}
      />

      <AdminWorkspaceEditorDialog
        open={workspaceEditor?.kind === 'featureFlags'}
        workspace={workspaceEditor?.kind === 'featureFlags' ? workspaceEditor.workspace : null}
        kind="featureFlags"
        rows={workspaceEditor?.kind === 'featureFlags' ? (featureFlagDrafts[workspaceEditor.workspace.id] ?? createDraftRows(workspaceEditor.workspace.feature_flags)) : []}
        errorMessage={workspaceEditor?.kind === 'featureFlags' ? (featureFlagErrors[workspaceEditor.workspace.id] ?? null) : null}
        disabled={workspaceActionPending}
        onOpenChange={(open) => !open && setWorkspaceEditor(null)}
        onChangeRows={(rows) => {
          if (workspaceEditor?.kind !== 'featureFlags') return;
          setFeatureFlagDrafts((previous) => ({ ...previous, [workspaceEditor.workspace.id]: rows }));
          setFeatureFlagErrors((previous) => ({ ...previous, [workspaceEditor.workspace.id]: null }));
        }}
        onReset={() => {
          if (workspaceEditor?.kind !== 'featureFlags') return;
          setFeatureFlagDrafts((previous) => ({
            ...previous,
            [workspaceEditor.workspace.id]: createDraftRows(workspaceEditor.workspace.feature_flags),
          }));
          setFeatureFlagErrors((previous) => ({ ...previous, [workspaceEditor.workspace.id]: null }));
        }}
        onSave={(rows) => {
          if (workspaceEditor?.kind !== 'featureFlags') return;
          const parsed = parseDraftRows(rows);
          if (!parsed.data) {
            setFeatureFlagErrors((previous) => ({
              ...previous,
              [workspaceEditor.workspace.id]: parsed.error ?? 'Unable to parse feature-flag values.',
            }));
            return;
          }

          updateWorkspaceFeatureFlags.mutate({ workspace: workspaceEditor.workspace, featureFlags: parsed.data });
        }}
      />
    </section>
  );
}

function AdminMetric({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="gap-1">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
