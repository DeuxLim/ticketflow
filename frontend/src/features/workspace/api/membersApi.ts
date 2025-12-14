import { apiRequest } from '@/services/api/client';

export type WorkspaceMemberRole = { id: number; name: string; slug: string };
export type WorkspaceMemberRoleOption = WorkspaceMemberRole;

export type WorkspaceMember = {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
  };
  roles: WorkspaceMemberRole[];
  joined_at?: string;
};

export function listWorkspaceMembers(workspaceSlug: string) {
  return apiRequest<{ data: WorkspaceMember[] }>(`/workspaces/${workspaceSlug}/members`);
}

export function listWorkspaceMemberRoleOptions(workspaceSlug: string) {
  return apiRequest<{ data: WorkspaceMemberRoleOption[] }>(`/workspaces/${workspaceSlug}/members/role-options`);
}

export function updateWorkspaceMemberRoles(workspaceSlug: string, membershipId: number, roleId: number) {
  return apiRequest<{ data: WorkspaceMember }>(`/workspaces/${workspaceSlug}/members/${membershipId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role_ids: [roleId] }),
  });
}

export function removeWorkspaceMember(workspaceSlug: string, membershipId: number) {
  return apiRequest<{ message: string }>(`/workspaces/${workspaceSlug}/members/${membershipId}`, {
    method: 'DELETE',
  });
}
