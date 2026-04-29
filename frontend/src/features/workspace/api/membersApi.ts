import { apiRequest } from '@/services/api/client';

export type WorkspaceMember = {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
  };
  roles: Array<{ id: number; name: string; slug: string }>;
};

export function listWorkspaceMembers(workspaceSlug: string) {
  return apiRequest<{ data: WorkspaceMember[] }>(`/workspaces/${workspaceSlug}/members`);
}
