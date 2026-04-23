// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { apiRequest } from '@/services/api/client';

vi.mock('@/services/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/services/api/client')>('@/services/api/client');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

vi.mock('@/lib/auth-session', () => ({
  setAuthToken: vi.fn(),
}));

vi.mock('@/lib/workspace-session', () => ({
  getLastWorkspaceSlug: vi.fn(() => null),
  setLastWorkspaceSlug: vi.fn(),
}));

function renderWithProviders(ui: ReactElement, initialEntry = '/auth/login', state?: unknown) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: initialEntry, state }]}>
        <Routes>
          <Route path="/auth/login" element={ui} />
          <Route path="/admin" element={<p>Admin opened</p>} />
          <Route path="/workspaces/new" element={<p>Workspace onboarding opened</p>} />
          <Route path="/workspaces/:workspaceSlug" element={<p>Workspace opened</p>} />
          <Route path="/workspaces/:workspaceSlug/tickets" element={<p>Protected workspace route opened</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects platform admins to the admin dashboard after login', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/auth/login') {
        return {
          data: {
            token: 'admin-token',
            user: { is_platform_admin: true },
          },
        } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@ticketing.local' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Admin@12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Admin opened')).not.toBeNull();
    });
  });

  it('opens the last workspace after a non-admin login when a preferred slug exists', async () => {
    const { getLastWorkspaceSlug, setLastWorkspaceSlug } = await import('@/lib/workspace-session');

    vi.mocked(getLastWorkspaceSlug).mockReturnValue('beta-workspace');
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/auth/login') {
        return {
          data: {
            token: 'user-token',
            user: { is_platform_admin: false },
          },
        } as never;
      }

      if (path === '/workspaces') {
        return {
          data: [
            { id: 1, name: 'Alpha', slug: 'alpha-workspace', owner_user_id: 1 },
            { id: 2, name: 'Beta', slug: 'beta-workspace', owner_user_id: 1 },
          ],
        } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@ticketing.local' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'User@12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Workspace opened')).not.toBeNull();
    });

    expect(setLastWorkspaceSlug).toHaveBeenCalledWith('beta-workspace');
  });

  it('redirects non-admin users without workspaces to onboarding', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/auth/login') {
        return {
          data: {
            token: 'user-token',
            user: { is_platform_admin: false },
          },
        } as never;
      }

      if (path === '/workspaces') {
        return { data: [] } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@ticketing.local' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'User@12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Workspace onboarding opened')).not.toBeNull();
    });
  });

  it('returns users to the originally requested protected route', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/auth/login') {
        return {
          data: {
            token: 'user-token',
            user: { is_platform_admin: false },
          },
        } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithProviders(<LoginPage />, '/auth/login', {
      from: { pathname: '/workspaces/demo-workspace/tickets' },
    });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@ticketing.local' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'User@12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Protected workspace route opened')).not.toBeNull();
    });
  });

  it('shows server login errors', async () => {
    vi.mocked(apiRequest).mockRejectedValue(new Error('Invalid email or password.'));

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@ticketing.local' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).not.toBeNull();
    });
  });
});
