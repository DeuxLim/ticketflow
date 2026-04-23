// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceDashboardPage } from './WorkspaceDashboardPage';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { ApiError, apiRequest } from '@/services/api/client';

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
          <Route path="/workspaces/:workspaceSlug" element={ui} />
          <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<p>Ticket details opened</p>} />
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

describe('WorkspaceDashboardPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a forbidden state when the user cannot view dashboard sources', async () => {
    mockAccess([]);

    renderWithProviders(<WorkspaceDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview unavailable')).not.toBeNull();
      expect(screen.getByText(/at least one view permission/i)).not.toBeNull();
    });
  });

  it('renders dashboard metrics and recent tickets when access is available', async () => {
    mockAccess(['customers.view', 'tickets.view', 'reporting.view']);

    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/workspaces/demo-workspace/customers?per_page=1') {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 1, total: 12 } } as never;
      }

      if (path === '/workspaces/demo-workspace/tickets?per_page=5') {
        return {
          data: [
            {
              id: 101,
              workspace_id: 1,
              customer_id: 1,
              created_by_user_id: 1,
              assigned_to_user_id: null,
              ticket_number: 'TKT-101',
              title: 'Payment queue stalled',
              description: 'Investigate delayed jobs',
              status: 'open',
              priority: 'high',
              customer: { id: 1, name: 'Acme', email: 'ops@acme.test' },
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 5, total: 8 },
        } as never;
      }

      if (path === '/workspaces/demo-workspace/reports/overview') {
        return {
          data: {
            totals: { tickets: 18, open: 7, resolved: 11 },
            backlog_by_priority: { urgent: 2, high: 3, medium: 2 },
          },
        } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithProviders(<WorkspaceDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Operations Overview')).not.toBeNull();
    });

    expect(screen.getByText('12')).not.toBeNull();
    expect(screen.getByText('18')).not.toBeNull();
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
    expect(screen.getByText('Payment queue stalled')).not.toBeNull();
    expect(screen.getByRole('link', { name: /payment queue stalled/i })).not.toBeNull();
  });

  it('shows a forbidden state when dashboard permissions change after load', async () => {
    mockAccess(['customers.view', 'tickets.view']);

    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/workspaces/demo-workspace/customers?per_page=1') {
        throw new ApiError('Forbidden', 403);
      }

      if (path === '/workspaces/demo-workspace/tickets?per_page=5') {
        throw new ApiError('Forbidden', 403);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithProviders(<WorkspaceDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview unavailable')).not.toBeNull();
      expect(screen.getByText(/permissions changed/i)).not.toBeNull();
    });
  });
});
