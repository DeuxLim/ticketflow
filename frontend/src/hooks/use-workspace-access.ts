import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/services/api/client';
import type { ApiEnvelope } from '@/types/api';

type WorkspaceAccessPayload = {
  workspace_id: number;
  roles: Array<{ id: number; name: string; slug: string }>;
  permissions: string[];
};

export function useWorkspaceAccess(workspaceSlug?: string) {
  const query = useQuery({
    queryKey: ['workspace', workspaceSlug, 'access'],
    queryFn: () => apiRequest<ApiEnvelope<WorkspaceAccessPayload>>(`/workspaces/${workspaceSlug}/access`),
    enabled: Boolean(workspaceSlug),
    staleTime: 60_000,
  });

  const permissions = new Set(query.data?.data.permissions ?? []);

  const can = (permission: string): boolean => permissions.has(permission);

  return {
    ...query,
    access: query.data?.data,
    can,
  };
}
