// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest } from '@/services/api/client';
import { TicketsPage } from './TicketsPage';

vi.mock('@/hooks/use-workspace-access', () => ({
  useWorkspaceAccess: vi.fn(),
}));

vi.mock('@/services/api/client', () => ({
  ApiError: class extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  apiRequest: vi.fn(),
}));

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workspaces/acme/tickets']}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAccess(canView = true, canManage = true) {
  vi.mocked(useWorkspaceAccess).mockReturnValue({
    isLoading: false,
    can: (permission: string) => {
      if (permission === 'tickets.view') return canView;
      if (permission === 'tickets.manage') return canManage;
      return false;
    },
  } as ReturnType<typeof useWorkspaceAccess>);
}

describe('TicketsPage interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess(true, true);

    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }
      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }
      if (path === '/workspaces/acme/saved-views') {
        return { data: [] } as never;
      }
      if (path.startsWith('/workspaces/acme/tickets')) {
        return {
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
        } as never;
      }

      return { data: [] } as never;
    });
  });

  it('updates ticket query when search input changes', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets?page=1');
    });

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'network' } });

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets?search=network&page=1');
    });
  });

  it('shows list error message when ticket query fails', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }
      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }
      if (path === '/workspaces/acme/saved-views') {
        return { data: [] } as never;
      }
      if (path.startsWith('/workspaces/acme/tickets')) {
        throw new Error('Ticket list failed.');
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket list failed.')).not.toBeNull();
    });
  });

  it('saves current filters as a saved view', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'network outage' } });
    fireEvent.change(screen.getByLabelText('New view name'), { target: { value: 'Network incidents' } });
    const saveButton = screen.getAllByRole('button', { name: 'Save current filters' }).find((button) => !button.hasAttribute('disabled'));
    if (!saveButton) throw new Error('Save current filters button not enabled');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/saved-views', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Network incidents',
          is_shared: false,
          filters: {
            search: 'network outage',
            status: 'all',
            priority: 'all',
            customerId: 'all',
            assigneeId: 'all',
            page: 1,
          },
        }),
      });
    });
  });
});
