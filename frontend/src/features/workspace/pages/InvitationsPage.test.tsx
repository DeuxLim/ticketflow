// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest } from '@/services/api/client';
import { InvitationsPage } from './InvitationsPage';

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
      <MemoryRouter initialEntries={['/workspaces/acme/invitations']}>
        <Routes>
          <Route path="/workspaces/:workspaceSlug/invitations" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAccess() {
  vi.mocked(useWorkspaceAccess).mockReturnValue({
    isLoading: false,
    can: (permission: string): boolean => permission === 'invitations.manage',
  } as unknown as ReturnType<typeof useWorkspaceAccess>);
}

describe('InvitationsPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAccess();
    vi.mocked(apiRequest).mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === '/workspaces/acme/roles') {
        return { data: [{ id: 2, name: 'Agent', slug: 'agent' }] } as never;
      }

      if (path === '/workspaces/acme/invitations/7/cancel' && options?.method === 'POST') {
        return { data: {} } as never;
      }

      if (path === '/workspaces/acme/invitations') {
        return {
          data: [
            {
              id: 7,
              email: 'new.agent@example.test',
              status: 'pending',
              expires_at: '2026-05-20T00:00:00Z',
              roles: [{ id: 2, name: 'Agent', slug: 'agent' }],
            },
          ],
        } as never;
      }

      throw new Error(`Unexpected request: ${path}`);
    });
  });

  it('renders invitation data in the responsive card layout', async () => {
    renderWithProviders(<InvitationsPage />);

    await waitFor(() => {
      expect(screen.getByRole('article', { name: 'Invitation new.agent@example.test' })).not.toBeNull();
    });

    expect(screen.getAllByText('new.agent@example.test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Agent').length).toBeGreaterThan(0);
  });

  it('confirms before cancelling a pending invitation', async () => {
    renderWithProviders(<InvitationsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Actions for invitation new.agent@example.test' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Actions for invitation new.agent@example.test' })[0]);
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Cancel invite' })).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cancel invite' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cancel invitation?' })).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Invite' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/invitations/7/cancel', { method: 'POST' });
    });
  });
});
