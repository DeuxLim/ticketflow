import { apiRequest } from '@/services/api/client';

export type WorkspaceRole = { id: number; name: string; slug: string };
export type WorkspaceInvitation = {
  id: number;
  email: string;
  status: string;
  expires_at: string;
  roles: Array<{ id: number; name: string; slug: string }>;
};

export function listWorkspaceRoles(workspaceSlug: string) {
  return apiRequest<{ data: WorkspaceRole[] }>(`/workspaces/${workspaceSlug}/roles`);
}

export function listWorkspaceInvitations(workspaceSlug: string) {
  return apiRequest<{ data: WorkspaceInvitation[] }>(`/workspaces/${workspaceSlug}/invitations`);
}

export function createWorkspaceInvitation(workspaceSlug: string, email: string, roleId: number) {
  return apiRequest(`/workspaces/${workspaceSlug}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ email, role_ids: [roleId] }),
  });
}

export function cancelWorkspaceInvitation(workspaceSlug: string, invitationId: number) {
  return apiRequest(`/workspaces/${workspaceSlug}/invitations/${invitationId}/cancel`, { method: 'POST' });
}
