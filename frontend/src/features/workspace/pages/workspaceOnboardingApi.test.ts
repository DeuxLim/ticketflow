import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import { createWorkspace, listUserWorkspaces } from './workspaceOnboardingApi';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('workspaceOnboardingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ data: [] } as never);
  });

  it('lists user workspaces', async () => {
    await listUserWorkspaces();
    expect(apiRequest).toHaveBeenCalledWith('/workspaces');
  });

  it('creates workspace', async () => {
    await createWorkspace({ name: 'Acme', slug: 'acme' });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', slug: 'acme' }),
    });
  });
});
