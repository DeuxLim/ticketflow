// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireAuth, RequirePlatformAdmin } from './route-guards';
import { apiRequest } from '@/services/api/client';

vi.mock('@/services/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/services/api/client')>('@/services/api/client');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

vi.mock('@/lib/auth-session', () => ({
  getAuthToken: vi.fn(() => null),
}));

function renderWithProviders(ui: ReactElement, initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('route guards', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects unauthenticated users to login', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/auth/login" element={<p>Login page</p>} />
        <Route
          path="/workspaces/demo"
          element={(
            <RequireAuth>
              <p>Protected workspace</p>
            </RequireAuth>
          )}
        />
      </Routes>,
      '/workspaces/demo',
    );

    await waitFor(() => {
      expect(screen.getByText('Login page')).not.toBeNull();
    });
  });

  it('allows authenticated users through the auth guard', async () => {
    const { getAuthToken } = await import('@/lib/auth-session');
    vi.mocked(getAuthToken).mockReturnValue('token');

    renderWithProviders(
      <Routes>
        <Route
          path="/workspaces/demo"
          element={(
            <RequireAuth>
              <p>Protected workspace</p>
            </RequireAuth>
          )}
        />
      </Routes>,
      '/workspaces/demo',
    );

    await waitFor(() => {
      expect(screen.getByText('Protected workspace')).not.toBeNull();
    });
  });

  it('redirects non-admin users away from the admin area', async () => {
    const { getAuthToken } = await import('@/lib/auth-session');
    vi.mocked(getAuthToken).mockReturnValue('token');
    vi.mocked(apiRequest).mockResolvedValue({
      data: { id: 1, email: 'user@example.test', is_platform_admin: false },
    } as never);

    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>Home page</p>} />
        <Route
          path="/admin"
          element={(
            <RequirePlatformAdmin>
              <p>Admin page</p>
            </RequirePlatformAdmin>
          )}
        />
      </Routes>,
      '/admin',
    );

    await waitFor(() => {
      expect(screen.getByText('Home page')).not.toBeNull();
    });
  });

  it('redirects to login when admin verification fails', async () => {
    const { getAuthToken } = await import('@/lib/auth-session');
    vi.mocked(getAuthToken).mockReturnValue('token');
    vi.mocked(apiRequest).mockRejectedValue(new Error('Auth failed'));

    renderWithProviders(
      <Routes>
        <Route path="/auth/login" element={<p>Login page</p>} />
        <Route
          path="/admin"
          element={(
            <RequirePlatformAdmin>
              <p>Admin page</p>
            </RequirePlatformAdmin>
          )}
        />
      </Routes>,
      '/admin',
    );

    await waitFor(() => {
      expect(screen.getByText('Login page')).not.toBeNull();
    });
  });
});
