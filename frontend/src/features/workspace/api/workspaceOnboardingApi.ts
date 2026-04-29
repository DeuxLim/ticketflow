import { apiRequest } from '@/services/api/client';
import type { ApiEnvelope, Workspace } from '@/types/api';

export function listUserWorkspaces() {
  return apiRequest<ApiEnvelope<Workspace[]>>('/workspaces');
}

export function createWorkspace(payload: { name: string; slug: string }) {
  return apiRequest<ApiEnvelope<Workspace>>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
