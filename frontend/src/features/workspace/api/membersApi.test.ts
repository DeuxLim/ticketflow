import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import {
  listWorkspaceMemberRoleOptions,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRoles,
} from './membersApi';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('membersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ data: [] } as never);
  });

  it('lists workspace members', async () => {
    await listWorkspaceMembers('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/members');
  });

  it('lists member role options', async () => {
    await listWorkspaceMemberRoleOptions('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/members/role-options');
  });

  it('updates workspace member roles', async () => {
    await updateWorkspaceMemberRoles('acme', 10, 2);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/members/10', {
      method: 'PATCH',
      body: JSON.stringify({ role_ids: [2] }),
    });
  });

  it('removes a workspace member', async () => {
    await removeWorkspaceMember('acme', 10);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/members/10', {
      method: 'DELETE',
    });
  });
});
