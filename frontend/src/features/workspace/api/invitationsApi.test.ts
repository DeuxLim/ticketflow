import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import {
  cancelWorkspaceInvitation,
  createWorkspaceInvitation,
  listWorkspaceInvitations,
  listWorkspaceRoles,
} from './invitationsApi';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('invitationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ data: [] } as never);
  });

  it('lists workspace roles', async () => {
    await listWorkspaceRoles('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/roles');
  });

  it('lists workspace invitations', async () => {
    await listWorkspaceInvitations('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/invitations');
  });

  it('creates workspace invitation', async () => {
    await createWorkspaceInvitation('acme', 'person@example.test', 5);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'person@example.test', role_ids: [5] }),
    });
  });

  it('cancels workspace invitation', async () => {
    await cancelWorkspaceInvitation('acme', 10);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/invitations/10/cancel', { method: 'POST' });
  });
});
