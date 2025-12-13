import { RowActionMenu, StatusBadge } from '@/components/app';
import { Badge } from '@/components/ui/badge';
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
              <>
              <div className="hidden overflow-x-auto lg:block">
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
                          <StatusBadge status={workspace.lifecycle_status} label={workspace.lifecycle_status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(workspace.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <WorkspaceActions
                              workspace={workspace}
                              disabled={workspaceActionPending}
                              onSuspendWorkspace={onSuspendWorkspace}
                              onReactivateWorkspace={onReactivateWorkspace}
                              onToggleMaintenance={onToggleMaintenance}
                              onToggleIsolation={onToggleIsolation}
                              onOpenWorkspaceEditor={onOpenWorkspaceEditor}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 p-4 lg:hidden">
                {workspaces.map((workspace) => (
                  <article key={workspace.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{workspace.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{workspace.slug}</p>
                      </div>
                      <WorkspaceActions
                        workspace={workspace}
                        disabled={workspaceActionPending}
                        onSuspendWorkspace={onSuspendWorkspace}
                        onReactivateWorkspace={onReactivateWorkspace}
                        onToggleMaintenance={onToggleMaintenance}
                        onToggleIsolation={onToggleIsolation}
                        onOpenWorkspaceEditor={onOpenWorkspaceEditor}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant={workspace.tenant_mode === 'dedicated' ? 'default' : 'secondary'}>
                        {workspace.tenant_mode}
                      </Badge>
                      {workspace.maintenance_mode && <Badge variant="outline">maintenance</Badge>}
                      <StatusBadge status={workspace.lifecycle_status} label={workspace.lifecycle_status} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Members</dt>
                        <dd className="mt-1 font-medium">{workspace.memberships_count}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Tickets</dt>
                        <dd className="mt-1 font-medium">{workspace.tickets_count}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              </>
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
              <UsersList users={users} />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function UsersList({ users }: { users: AdminUser[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
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
                <TableCell className="font-medium">{formatUserName(user)}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <UserRoleBadge user={user} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {users.map((user) => (
          <article key={user.id} aria-label={`User ${formatUserName(user)}`} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{formatUserName(user)}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <UserRoleBadge user={user} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Username</dt>
                <dd className="mt-1 truncate font-medium">{user.username}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-1 font-medium">{new Date(user.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}

function UserRoleBadge({ user }: { user: AdminUser }) {
  return user.is_platform_admin ? <Badge>Platform admin</Badge> : <Badge variant="secondary">User</Badge>;
}

function formatUserName(user: AdminUser) {
  return `${user.first_name} ${user.last_name}`.trim();
}

function WorkspaceActions({
  workspace,
  disabled,
  onSuspendWorkspace,
  onReactivateWorkspace,
  onToggleMaintenance,
  onToggleIsolation,
  onOpenWorkspaceEditor,
}: {
  workspace: AdminWorkspace;
  disabled: boolean;
  onSuspendWorkspace: (workspace: AdminWorkspace) => void;
  onReactivateWorkspace: (workspace: AdminWorkspace) => void;
  onToggleMaintenance: (workspace: AdminWorkspace) => void;
  onToggleIsolation: (workspace: AdminWorkspace) => void;
  onOpenWorkspaceEditor: (workspace: AdminWorkspace, kind: 'limits' | 'featureFlags') => void;
}) {
  return (
    <RowActionMenu
      label={`Actions for ${workspace.name}`}
      actions={[
        {
          label: workspace.lifecycle_status === 'active' ? 'Suspend' : 'Reactivate',
          onSelect: () => workspace.lifecycle_status === 'active' ? onSuspendWorkspace(workspace) : onReactivateWorkspace(workspace),
          disabled,
          destructive: workspace.lifecycle_status === 'active',
        },
        {
          label: workspace.maintenance_mode ? 'Disable maintenance' : 'Enable maintenance',
          onSelect: () => onToggleMaintenance(workspace),
          disabled,
        },
        {
          label: workspace.tenant_mode === 'shared' ? 'Mark dedicated' : 'Mark shared',
          onSelect: () => onToggleIsolation(workspace),
          disabled,
        },
        {
          label: 'Manage limits',
          onSelect: () => onOpenWorkspaceEditor(workspace, 'limits'),
          disabled,
        },
        {
          label: 'Manage feature flags',
          onSelect: () => onOpenWorkspaceEditor(workspace, 'featureFlags'),
          disabled,
        },
      ]}
    />
  );
}
