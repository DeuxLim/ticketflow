import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdminUser, AdminWorkspace, ApiPaginationMeta } from '@/types/api';

type Props = {
  userSearch: string;
  onUserSearchChange: (value: string) => void;
  users: AdminUser[];
  usersMeta?: ApiPaginationMeta;
  usersLoading: boolean;
  usersError: boolean;
  workspaceSearch: string;
  onWorkspaceSearchChange: (value: string) => void;
  workspaces: AdminWorkspace[];
  workspacesMeta?: ApiPaginationMeta;
  workspacesLoading: boolean;
  workspacesError: boolean;
  workspaceActionPending: boolean;
  onSuspendWorkspace: (workspace: AdminWorkspace) => void;
  onReactivateWorkspace: (workspace: AdminWorkspace) => void;
  onToggleMaintenance: (workspace: AdminWorkspace) => void;
  onToggleIsolation: (workspace: AdminWorkspace) => void;
  onOpenWorkspaceEditor: (workspace: AdminWorkspace, kind: 'limits' | 'featureFlags') => void;
};

export function AdminDashboardTabs({
  userSearch,
  onUserSearchChange,
  users,
  usersMeta,
  usersLoading,
  usersError,
  workspaceSearch,
  onWorkspaceSearchChange,
  workspaces,
  workspacesMeta,
  workspacesLoading,
  workspacesError,
  workspaceActionPending,
  onSuspendWorkspace,
  onReactivateWorkspace,
  onToggleMaintenance,
  onToggleIsolation,
  onOpenWorkspaceEditor,
}: Props) {
  return (
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
                    onChange={(event) => onWorkspaceSearchChange(event.target.value)}
                    placeholder="Name or slug"
                    value={workspaceSearch}
                  />
                </Field>
              </FieldGroup>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {workspacesLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading workspaces...</p>
            ) : workspacesError ? (
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
                                  onClick={() => onSuspendWorkspace(workspace)}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  Suspend
                                </Button>
                              ) : (
                                <Button
                                  disabled={workspaceActionPending}
                                  onClick={() => onReactivateWorkspace(workspace)}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  Reactivate
                                </Button>
                              )}
                              <Button
                                disabled={workspaceActionPending}
                                onClick={() => onToggleMaintenance(workspace)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                {workspace.maintenance_mode ? 'Disable maintenance' : 'Enable maintenance'}
                              </Button>
                              <Button
                                disabled={workspaceActionPending}
                                onClick={() => onToggleIsolation(workspace)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                {workspace.tenant_mode === 'shared' ? 'Mark dedicated' : 'Mark shared'}
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
                                  onClick={() => onOpenWorkspaceEditor(workspace, 'limits')}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  Manage limits
                                </Button>
                                <Button
                                  disabled={workspaceActionPending}
                                  onClick={() => onOpenWorkspaceEditor(workspace, 'featureFlags')}
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
                    onChange={(event) => onUserSearchChange(event.target.value)}
                    placeholder="Name, username, or email"
                    value={userSearch}
                  />
                </Field>
              </FieldGroup>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading users...</p>
            ) : usersError ? (
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
  );
}
