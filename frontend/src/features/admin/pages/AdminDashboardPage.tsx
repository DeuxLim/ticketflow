import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDashboardTabs } from '@/features/admin/pages/AdminDashboardTabs';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <AdminMetric title="Users" value={stats.users_count} description="Registered accounts" />
        <AdminMetric title="Workspaces" value={stats.workspaces_count} description="Tenant workspaces" />
        <AdminMetric title="Memberships" value={stats.memberships_count} description="User-workspace links" />
        <AdminMetric title="Tickets" value={stats.tickets_count} description="System-wide tickets" />
        <AdminMetric title="Suspended" value={stats.suspended_workspaces_count} description="Suspended tenants" />
        <AdminMetric title="Maintenance" value={stats.maintenance_workspaces_count} description="Workspaces in maintenance mode" />
        <AdminMetric title="Dedicated" value={stats.dedicated_workspaces_count} description="Dedicated isolation tenants" />
        <AdminMetric title="Automation Failures" value={stats.failed_automation_executions_count} description="Failed rule executions" />
      </div>

      <Separator />

      <AdminDashboardTabs
        userSearch={userSearch}
        onUserSearchChange={setUserSearch}
        users={users}
        usersMeta={usersMeta}
        usersLoading={usersQuery.isLoading}
        usersError={usersQuery.isError}
        workspaceSearch={workspaceSearch}
        onWorkspaceSearchChange={setWorkspaceSearch}
        workspaces={workspaces}
        workspacesMeta={workspacesMeta}
        workspacesLoading={workspacesQuery.isLoading}
        workspacesError={workspacesQuery.isError}
        workspaceActionPending={workspaceActionPending}
        onSuspendWorkspace={(workspace) => suspendWorkspace.mutate(workspace)}
        onReactivateWorkspace={(workspace) => reactivateWorkspace.mutate(workspace)}
        onToggleMaintenance={(workspace) => toggleMaintenance.mutate(workspace)}
        onToggleIsolation={(workspace) => toggleIsolation.mutate(workspace)}
        onOpenWorkspaceEditor={openWorkspaceEditor}
      />

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
