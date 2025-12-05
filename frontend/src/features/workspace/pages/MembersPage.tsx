import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { ConfirmDialog, EmptyState, PageHeader, RowActionMenu } from '@/components/app';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest, ApiError } from '@/services/api/client';
import {
  listWorkspaceMemberRoleOptions,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRoles,
} from '@/features/workspace/api/membersApi';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ApiEnvelope } from '@/types/api';

type AuthUser = {
  id: number;
  email: string;
  is_platform_admin: boolean;
};

export function MembersPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canManageMembers = accessQuery.can('members.manage');
  const canManageInvitations = accessQuery.can('invitations.manage');
  const canOpenSettings = ['workspace.manage', 'tickets.manage', 'security.manage', 'integrations.manage', 'automation.manage']
    .some((permission) => accessQuery.can(permission));

  const query = useQuery({
    queryKey: ['workspace', workspaceSlug, 'members'],
    queryFn: () => listWorkspaceMembers(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManageMembers),
  });
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<ApiEnvelope<AuthUser>>('/auth/me'),
    enabled: Boolean(workspaceSlug),
    retry: false,
    staleTime: 60_000,
  });
  const roleOptionsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'members', 'role-options'],
    queryFn: () => listWorkspaceMemberRoleOptions(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManageMembers && editingMember),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ membershipId, roleId }: { membershipId: number; roleId: number }) =>
      updateWorkspaceMemberRoles(workspaceSlug ?? '', membershipId, roleId),
    onSuccess: () => {
      setEditingMember(null);
      setSelectedRoleId('');
      setMemberActionError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'members'] });
    },
    onError: (error) => {
      setMemberActionError(error instanceof ApiError ? error.message : 'Unable to update member access.');
    },
  });
  const removeMemberMutation = useMutation({
    mutationFn: (membershipId: number) => removeWorkspaceMember(workspaceSlug ?? '', membershipId),
    onSuccess: () => {
      setMemberToRemove(null);
      setMemberActionError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'members'] });
    },
    onError: (error) => {
      setMemberActionError(error instanceof ApiError ? error.message : 'Unable to remove member.');
    },
  });

  const members = query.data?.data ?? [];
  const currentUserId = meQuery.data?.data.id;
  const adminCount = members.filter((member) => memberHasAdminRole(member)).length;

  if (accessQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Checking access...</p>;
  }

  if (!canManageMembers) {
    return (
      <ForbiddenState
        title="Members unavailable"
        description="You need the members.manage permission to view workspace membership details."
      />
    );
  }

  if (query.isError && (query.error instanceof ApiError) && query.error.status === 403) {
    return (
      <ForbiddenState
        title="Members unavailable"
        description="Your role can no longer view member management data for this workspace."
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Membership"
        title="Member Directory"
        description="Review current access, change member roles, and remove workspace members without leaving the roster."
        actions={(
          <>
            {canManageInvitations ? (
              <Button onClick={() => navigate(`/workspaces/${workspaceSlug}/invitations`)} type="button" variant="outline">
                Invite Teammates
              </Button>
            ) : null}
            {canOpenSettings ? (
              <Button onClick={() => navigate(`/workspaces/${workspaceSlug}/settings`)} type="button">
                Access Settings
              </Button>
            ) : null}
          </>
        )}
      />

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Available Actions</CardTitle>
          <CardDescription>Handle joined members here, then use the adjacent admin surfaces for invites and broader access policy.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <article className="rounded-lg border bg-card p-4">
            <p className="font-medium">Change a teammate's role</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reassign joined members between Admin, Agent, and Viewer directly from the member list.
            </p>
          </article>
          <article className="rounded-lg border bg-card p-4">
            <p className="font-medium">Remove workspace access</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Remove members from the workspace with guardrails that protect your own access and the last Admin.
            </p>
          </article>
          <article className="rounded-lg border bg-card p-4">
            <p className="font-medium">Invite or cancel access requests</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Send new invites and cancel pending ones from the Invitations screen.
            </p>
          </article>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Current Members</CardTitle>
          <CardDescription>Scan current access assignments and take member-specific actions from the same roster.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : query.isError ? (
            <p className="text-sm text-destructive">{(query.error as Error).message}</p>
          ) : members.length === 0 ? (
            <EmptyState title="No members yet." description="No active members are assigned to this workspace yet." />
          ) : (
            <MembersList
              members={members}
              currentUserId={currentUserId}
              adminCount={adminCount}
              onEditMember={(member) => {
                setEditingMember(member);
                setSelectedRoleId(String(member.roles[0]?.id ?? ''));
                setMemberActionError(null);
              }}
              onRemoveMember={(member) => {
                setMemberToRemove(member);
                setMemberActionError(null);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingMember)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMember(null);
            setSelectedRoleId('');
            setMemberActionError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMember ? `Edit role for ${formatMemberName(editingMember)}` : 'Edit member role'}</DialogTitle>
            <DialogDescription>Choose the single workspace role this member should keep after the change.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {memberActionError ? (
              <p className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {memberActionError}
              </p>
            ) : null}

            {roleOptionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading role options...</p>
            ) : roleOptionsQuery.isError ? (
              <p className="text-sm text-destructive">{(roleOptionsQuery.error as Error).message}</p>
            ) : (
              <Select value={selectedRoleId} onValueChange={(value) => setSelectedRoleId(value ?? '')}>
                <SelectTrigger className="w-full" id="member-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(roleOptionsQuery.data?.data ?? []).map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setEditingMember(null);
                setSelectedRoleId('');
                setMemberActionError(null);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={roleOptionsQuery.isLoading || updateMemberMutation.isPending || !editingMember || !selectedRoleId}
              onClick={() => {
                if (editingMember && selectedRoleId) {
                  updateMemberMutation.mutate({
                    membershipId: editingMember.id,
                    roleId: Number(selectedRoleId),
                  });
                }
              }}
              type="button"
            >
              {updateMemberMutation.isPending ? 'Saving...' : 'Save Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToRemove(null);
            setMemberActionError(null);
          }
        }}
        title="Remove member?"
        description={
          memberToRemove
            ? `This will remove ${formatMemberName(memberToRemove)} from the workspace.`
            : 'This member will be removed from the workspace.'
        }
        confirmLabel="Remove Member"
        errorMessage={memberActionError}
        isPending={removeMemberMutation.isPending}
        variant="destructive"
        onConfirm={() => {
          if (memberToRemove) {
            removeMemberMutation.mutate(memberToRemove.id);
          }
        }}
      />
    </section>
  );
}

type WorkspaceMember = Awaited<ReturnType<typeof listWorkspaceMembers>>['data'][number];

function MembersList({
  members,
  currentUserId,
  adminCount,
  onEditMember,
  onRemoveMember,
}: {
  members: WorkspaceMember[];
  currentUserId?: number;
  adminCount: number;
  onEditMember: (member: WorkspaceMember) => void;
  onRemoveMember: (member: WorkspaceMember) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[780px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{formatMemberName(member)}</span>
                    {currentUserId === member.user.id ? <Badge variant="secondary">You</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>
                  <MemberRoleBadges member={member} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <MemberActions
                      adminCount={adminCount}
                      currentUserId={currentUserId}
                      member={member}
                      onEditMember={onEditMember}
                      onRemoveMember={onRemoveMember}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {members.map((member) => (
          <article key={member.id} aria-label={`Member ${formatMemberName(member)}`} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{formatMemberName(member)}</p>
                  {currentUserId === member.user.id ? <Badge variant="secondary">You</Badge> : null}
                </div>
                <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
              </div>
              <MemberActions
                adminCount={adminCount}
                currentUserId={currentUserId}
                member={member}
                onEditMember={onEditMember}
                onRemoveMember={onRemoveMember}
              />
            </div>
            <div className="mt-3">
              <MemberRoleBadges member={member} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function MemberActions({
  member,
  currentUserId,
  adminCount,
  onEditMember,
  onRemoveMember,
}: {
  member: WorkspaceMember;
  currentUserId?: number;
  adminCount: number;
  onEditMember: (member: WorkspaceMember) => void;
  onRemoveMember: (member: WorkspaceMember) => void;
}) {
  const protectionMessage = getMemberProtectionMessage(member, currentUserId, adminCount);

  if (protectionMessage) {
    return <p className="max-w-[220px] text-right text-xs text-muted-foreground">{protectionMessage}</p>;
  }

  return (
    <RowActionMenu
      label={`Actions for member ${formatMemberName(member)}`}
      actions={[
        { label: 'Edit role', onSelect: () => onEditMember(member) },
        { label: 'Remove member', onSelect: () => onRemoveMember(member), destructive: true },
      ]}
    />
  );
}

function MemberRoleBadges({ member }: { member: WorkspaceMember }) {
  return (
    <div className="flex flex-wrap gap-1">
      {member.roles.map((role) => (
        <Badge key={role.id} variant="outline">{role.name}</Badge>
      ))}
    </div>
  );
}

function formatMemberName(member: WorkspaceMember) {
  return `${member.user.first_name} ${member.user.last_name}`.trim();
}

function memberHasAdminRole(member: WorkspaceMember) {
  return member.roles.some((role) => role.slug === 'admin');
}

function getMemberProtectionMessage(member: WorkspaceMember, currentUserId: number | undefined, adminCount: number) {
  if (currentUserId === member.user.id) {
    return 'You cannot change your own workspace access from this screen.';
  }

  if (memberHasAdminRole(member) && adminCount <= 1) {
    return 'The last Admin must keep workspace access.';
  }

  return null;
}
