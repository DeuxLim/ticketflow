// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest } from '@/services/api/client';

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

vi.mock('@/lib/auth-session', () => ({
  clearAuthToken: vi.fn(),
}));

vi.mock('@/lib/workspace-session', () => ({
  setLastWorkspaceSlug: vi.fn(),
}));

function renderWithProviders(ui: ReactElement, initialEntry = '/workspaces/demo-workspace') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/auth/login" element={<p>Login opened</p>} />
          <Route path="/workspaces/:workspaceSlug" element={ui}>
            <Route index element={<p>Workspace overview</p>} />
            <Route path="settings" element={<p>Workspace settings</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAccess(permissions: string[]) {
  vi.mocked(useWorkspaceAccess).mockReturnValue({
    isLoading: false,
    can: (permission: string) => permissions.includes(permission),
  } as ReturnType<typeof useWorkspaceAccess>);
}

describe('WorkspaceLayout', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/workspaces') {
        return {
          data: [
            { id: 1, name: 'Demo Workspace', slug: 'demo-workspace', owner_user_id: 1 },
          ],
        } as never;
      }

      if (path === '/auth/logout') {
        return { message: 'Logged out' } as never;
      }

      if (path === '/workspaces/demo-workspace/notifications') {
        return { data: [], meta: { unread_count: 0 } } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('shows only the links allowed by workspace permissions', async () => {
    mockAccess(['customers.view', 'tickets.view']);

    renderWithProviders(<WorkspaceLayout />);

    await waitFor(() => {
      expect(screen.getAllByText('Demo Workspace').length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('link', { name: /overview/i })).not.toBeNull();
    expect(screen.getByRole('link', { name: /customers/i })).not.toBeNull();
    expect(screen.getByRole('link', { name: /tickets/i })).not.toBeNull();
    expect(screen.queryByRole('link', { name: /members/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /invitations/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /settings/i })).toBeNull();
  });

  it('logs out and redirects even when the API call fails', async () => {
    const { clearAuthToken } = await import('@/lib/auth-session');

    mockAccess(['customers.view']);
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/workspaces') {
        return {
          data: [
            { id: 1, name: 'Demo Workspace', slug: 'demo-workspace', owner_user_id: 1 },
          ],
        } as never;
      }

      if (path === '/auth/logout') {
        throw new Error('Network down');
      }

      if (path === '/workspaces/demo-workspace/notifications') {
        return { data: [], meta: { unread_count: 0 } } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithProviders(<WorkspaceLayout />);

    await waitFor(() => {
      expect(screen.getByText('Workspace overview')).not.toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(clearAuthToken).toHaveBeenCalled();
      expect(screen.getByText('Login opened')).not.toBeNull();
    });
  });

  it('shows unread notification count in the workspace header', async () => {
    mockAccess(['tickets.view']);
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/workspaces') {
        return {
          data: [
            { id: 1, name: 'Demo Workspace', slug: 'demo-workspace', owner_user_id: 1 },
          ],
        } as never;
      }

      if (path === '/workspaces/demo-workspace/notifications') {
        return {
          data: [
            {
              id: 10,
              workspace_id: 1,
              user_id: 2,
              ticket_id: 7,
              type: 'ticket.assigned',
              title: 'You were assigned TKT-000007',
              body: 'Branch outage',
              data: {},
              read_at: null,
              created_at: '2026-05-03T00:00:00Z',
              ticket: { id: 7, ticket_number: 'TKT-000007', title: 'Branch outage', status: 'open', priority: 'high' },
            },
          ],
          meta: { unread_count: 1 },
        } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(<WorkspaceLayout />);

    await waitFor(() => {
      expect(screen.getByLabelText('Notifications, 1 unread')).not.toBeNull();
    });
  });
});
