// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest } from '@/services/api/client';
import { MembersPage } from './MembersPage';

vi.mock('@/hooks/use-workspace-access', () => ({
  useWorkspaceAccess: vi.fn(),
}));

vi.mock('@/services/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/services/api/client')>('@/services/api/client');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workspaces/acme/members']}>
        <Routes>
          <Route path="/workspaces/:workspaceSlug/members" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAccess() {
  vi.mocked(useWorkspaceAccess).mockReturnValue({
    isLoading: false,
    can: (permission: string): boolean => permission === 'members.manage',
  } as unknown as ReturnType<typeof useWorkspaceAccess>);
}

describe('MembersPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAccess();
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/workspaces/acme/members') {
        return {
          data: [
            {
              id: 1,
              user: {
                id: 10,
                first_name: 'Ava',
                last_name: 'Agent',
                username: 'ava',
                email: 'ava@example.test',
              },
              roles: [{ id: 2, name: 'Agent', slug: 'agent' }],
            },
          ],
        } as never;
      }

      throw new Error(`Unexpected request: ${path}`);
    });
  });

  it('renders member data in the responsive card layout', async () => {
    renderWithProviders(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByRole('article', { name: 'Member Ava Agent' })).not.toBeNull();
    });

    expect(screen.getAllByText('Ava Agent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ava@example.test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Agent').length).toBeGreaterThan(0);
  });
});
