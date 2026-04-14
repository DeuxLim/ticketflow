import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import { listWorkspaceMembers } from './membersApi';

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
});
