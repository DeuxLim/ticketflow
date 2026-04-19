// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDashboardPage } from './AdminDashboardPage';
import { ApiError, apiRequest } from '@/services/api/client';

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
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminDashboardPage', () => {
  const getEditor = (title: 'Usage limits' | 'Feature flags') => {
    const header = screen.getByText(title);
    const container = header.closest('div');
    if (!container) {
      throw new Error(`${title} editor container not found.`);
    }

    return within(container);
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/admin/dashboard') {
        return {
          data: {
            users_count: 1,
            workspaces_count: 1,
            memberships_count: 1,
            tickets_count: 1,
            suspended_workspaces_count: 0,
            maintenance_workspaces_count: 0,
            dedicated_workspaces_count: 0,
            stale_idp_certificates_count: 0,
            failed_automation_executions_count: 0,
            pending_break_glass_count: 0,
          },
        } as never;
      }

      if (path.startsWith('/admin/users')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } } as never;
      }

      if (path.startsWith('/admin/workspaces')) {
        return {
          data: [
            {
              id: 1,
              name: 'Acme',
              slug: 'acme',
              owner_user_id: 1,
              owner: null,
              memberships_count: 1,
              tickets_count: 2,
              tenant_mode: 'shared',
              lifecycle_status: 'active',
              maintenance_mode: false,
              usage_limits: { max_agents: 5 },
              feature_flags: { beta_dashboard: false },
              created_at: '2026-04-17T00:00:00Z',
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        } as never;
      }

      return { data: {} } as never;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('updates workspace limits and feature flags', async () => {
    renderWithProviders(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Control plane').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText('Usage limits value'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save limits' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/admin/workspaces/acme/limits', {
        method: 'PATCH',
        body: JSON.stringify({ limits: { max_agents: 10 } }),
      });
    });

    fireEvent.change(screen.getByLabelText('Feature flags value'), { target: { value: 'true' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save feature flags' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/admin/workspaces/acme/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ feature_flags: { beta_dashboard: true } }),
      });
    });
  });

  it('shows parse validation errors for duplicate keys', async () => {
    renderWithProviders(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Control plane').length).toBeGreaterThan(0);
    });

    fireEvent.click(getEditor('Usage limits').getByRole('button', { name: 'Add entry' }));

    const keyInputs = getEditor('Usage limits').getAllByLabelText('Usage limits key');
    fireEvent.change(keyInputs[1], { target: { value: 'max_agents' } });

    fireEvent.click(getEditor('Usage limits').getByRole('button', { name: 'Save limits' }));

    await waitFor(() => {
      expect(screen.getByText('Duplicate key "max_agents" is not allowed.')).not.toBeNull();
    });
  });

  it('shows server errors for limits and feature flag updates', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/admin/dashboard') {
        return {
          data: {
            users_count: 1,
            workspaces_count: 1,
            memberships_count: 1,
            tickets_count: 1,
            suspended_workspaces_count: 0,
            maintenance_workspaces_count: 0,
            dedicated_workspaces_count: 0,
            stale_idp_certificates_count: 0,
            failed_automation_executions_count: 0,
            pending_break_glass_count: 0,
          },
        } as never;
      }

      if (path.startsWith('/admin/users')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } } as never;
      }

      if (path === '/admin/workspaces/acme/limits' && init?.method === 'PATCH') {
        throw new ApiError('Validation failed.', 422, {
          message: 'Validation failed.',
          errors: {
            'limits.max_agents': ['The max agents limit must be at least 1.'],
          },
        });
      }

      if (path === '/admin/workspaces/acme/feature-flags' && init?.method === 'PATCH') {
        throw new ApiError('Feature flags update failed.', 500, {
          message: 'Feature flags update failed.',
        });
      }

      if (path.startsWith('/admin/workspaces')) {
        return {
          data: [
            {
              id: 1,
              name: 'Acme',
              slug: 'acme',
              owner_user_id: 1,
              owner: null,
              memberships_count: 1,
              tickets_count: 2,
              tenant_mode: 'shared',
              lifecycle_status: 'active',
              maintenance_mode: false,
              usage_limits: { max_agents: 5 },
              feature_flags: { beta_dashboard: false },
              created_at: '2026-04-17T00:00:00Z',
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        } as never;
      }

      return { data: {} } as never;
    });

    renderWithProviders(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Control plane').length).toBeGreaterThan(0);
    });

    fireEvent.click(getEditor('Usage limits').getByRole('button', { name: 'Save limits' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/admin/workspaces/acme/limits', {
        method: 'PATCH',
        body: JSON.stringify({ limits: { max_agents: 5 } }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/max agents limit|validation failed|unable to update workspace limits/i)).not.toBeNull();
    });

    fireEvent.click(getEditor('Feature flags').getByRole('button', { name: 'Save feature flags' }));

    await waitFor(() => {
      expect(screen.getByText('Feature flags update failed.')).not.toBeNull();
    });
  });
});
