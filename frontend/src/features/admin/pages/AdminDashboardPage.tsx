import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

type DraftValueType = 'string' | 'number' | 'boolean';

type DraftRow = {
  id: number;
  key: string;
  type: DraftValueType;
  value: string;
};

let nextDraftRowId = 1;

function createEmptyDraftRow(): DraftRow {
  return { id: nextDraftRowId++, key: '', type: 'string', value: '' };
}

function valueTypeFromUnknown(value: unknown): DraftValueType {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return 'number';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  return 'string';
}

function valueStringFromUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null || typeof value === 'undefined') {
    return '';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function createDraftRows(source: Record<string, unknown> | null | undefined): DraftRow[] {
  const entries = Object.entries(source ?? {});

  if (entries.length === 0) {
    return [createEmptyDraftRow()];
  }

  return entries.map(([key, value]) => ({
    id: nextDraftRowId++,
    key,
    type: valueTypeFromUnknown(value),
    value: valueStringFromUnknown(value),
  }));
}

function parseDraftRows(rows: DraftRow[]): { data?: Record<string, unknown>; error?: string } {
  const parsed: Record<string, unknown> = {};

  for (const row of rows) {
    const key = row.key.trim();
    if (!key) {
      continue;
    }

    if (Object.hasOwn(parsed, key)) {
      return { error: `Duplicate key "${key}" is not allowed.` };
    }

    if (row.type === 'number') {
      const numericValue = Number(row.value);
      if (!Number.isFinite(numericValue)) {
        return { error: `Value for "${key}" must be a valid number.` };
      }

      parsed[key] = numericValue;
      continue;
    }

    if (row.type === 'boolean') {
      parsed[key] = row.value === 'true';
      continue;
    }

    parsed[key] = row.value;
  }

  return { data: parsed };
}

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [limitsDrafts, setLimitsDrafts] = useState<Record<number, DraftRow[]>>({});
  const [featureFlagDrafts, setFeatureFlagDrafts] = useState<Record<number, DraftRow[]>>({});
  const [limitsErrors, setLimitsErrors] = useState<Record<number, string | null>>({});
  const [featureFlagErrors, setFeatureFlagErrors] = useState<Record<number, string | null>>({});

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    },
  });

  const updateWorkspaceFeatureFlags = useMutation({
    mutationFn: ({ workspace, featureFlags }: { workspace: AdminWorkspace; featureFlags: Record<string, unknown> }) =>
      apiRequest(`/admin/workspaces/${workspace.slug}/feature-flags`, {
        method: 'PATCH',
        body: JSON.stringify({ feature_flags: featureFlags }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
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

                              <WorkspaceObjectEditor
                                title="Usage limits"
                                rows={limitsDrafts[workspace.id] ?? createDraftRows(workspace.usage_limits)}
                                errorMessage={limitsErrors[workspace.id] ?? null}
                                disabled={workspaceActionPending}
                                onChangeRows={(rows) => {
                                  setLimitsDrafts((previous) => ({ ...previous, [workspace.id]: rows }));
                                  setLimitsErrors((previous) => ({ ...previous, [workspace.id]: null }));
                                }}
                                onReset={() => {
                                  setLimitsDrafts((previous) => ({ ...previous, [workspace.id]: createDraftRows(workspace.usage_limits) }));
                                  setLimitsErrors((previous) => ({ ...previous, [workspace.id]: null }));
                                }}
                                onSave={(rows) => {
                                  const parsed = parseDraftRows(rows);
                                  if (!parsed.data) {
                                    setLimitsErrors((previous) => ({
                                      ...previous,
                                      [workspace.id]: parsed.error ?? 'Unable to parse limits values.',
                                    }));
                                    return;
                                  }

                                  updateWorkspaceLimits.mutate({ workspace, limits: parsed.data });
                                }}
                                saveButtonLabel="Save limits"
                              />

                              <WorkspaceObjectEditor
                                title="Feature flags"
                                rows={featureFlagDrafts[workspace.id] ?? createDraftRows(workspace.feature_flags)}
                                errorMessage={featureFlagErrors[workspace.id] ?? null}
                                disabled={workspaceActionPending}
                                onChangeRows={(rows) => {
                                  setFeatureFlagDrafts((previous) => ({ ...previous, [workspace.id]: rows }));
                                  setFeatureFlagErrors((previous) => ({ ...previous, [workspace.id]: null }));
                                }}
                                onReset={() => {
                                  setFeatureFlagDrafts((previous) => ({ ...previous, [workspace.id]: createDraftRows(workspace.feature_flags) }));
                                  setFeatureFlagErrors((previous) => ({ ...previous, [workspace.id]: null }));
                                }}
                                onSave={(rows) => {
                                  const parsed = parseDraftRows(rows);
                                  if (!parsed.data) {
                                    setFeatureFlagErrors((previous) => ({
                                      ...previous,
                                      [workspace.id]: parsed.error ?? 'Unable to parse feature-flag values.',
                                    }));
                                    return;
                                  }

                                  updateWorkspaceFeatureFlags.mutate({ workspace, featureFlags: parsed.data });
                                }}
                                saveButtonLabel="Save feature flags"
                              />
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
    </section>
  );
}

function WorkspaceObjectEditor({
  title,
  rows,
  errorMessage,
  disabled,
  onChangeRows,
  onSave,
  onReset,
  saveButtonLabel,
}: {
  title: string;
  rows: DraftRow[];
  errorMessage: string | null;
  disabled: boolean;
  onChangeRows: (rows: DraftRow[]) => void;
  onSave: (rows: DraftRow[]) => void;
  onReset: () => void;
  saveButtonLabel: string;
}) {
  const updateRow = (targetRowId: number, updater: (row: DraftRow) => DraftRow) => {
    onChangeRows(rows.map((row) => (row.id === targetRowId ? updater(row) : row)));
  };

  return (
    <div className="w-full space-y-2 rounded border border-border/70 p-2 text-left">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_1fr_auto]">
            <Input
              aria-label={`${title} key`}
              placeholder="key"
              value={row.key}
              onChange={(event) => updateRow(row.id, (current) => ({ ...current, key: event.target.value }))}
            />
            <select
              aria-label={`${title} type`}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={row.type}
              onChange={(event) =>
                updateRow(row.id, (current) => ({
                  ...current,
                  type: event.target.value as DraftValueType,
                  value: event.target.value === 'boolean' ? 'false' : current.value,
                }))
              }
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
            </select>
            {row.type === 'boolean' ? (
              <select
                aria-label={`${title} value`}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={row.value}
                onChange={(event) => updateRow(row.id, (current) => ({ ...current, value: event.target.value }))}
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : (
              <Input
                aria-label={`${title} value`}
                placeholder="value"
                type={row.type === 'number' ? 'number' : 'text'}
                value={row.value}
                onChange={(event) => updateRow(row.id, (current) => ({ ...current, value: event.target.value }))}
              />
            )}
            <Button
              disabled={rows.length <= 1 || disabled}
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => onChangeRows(rows.filter((candidate) => candidate.id !== row.id))}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
      {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={disabled}
          size="sm"
          type="button"
          variant="outline"
          onClick={() => onChangeRows([...rows, createEmptyDraftRow()])}
        >
          Add entry
        </Button>
        <Button disabled={disabled} size="sm" type="button" variant="outline" onClick={() => onSave(rows)}>
          {saveButtonLabel}
        </Button>
        <Button disabled={disabled} size="sm" type="button" variant="ghost" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
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
