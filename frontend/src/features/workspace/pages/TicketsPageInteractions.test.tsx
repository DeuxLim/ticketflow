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

  it('distinguishes empty queues from filtered empty results', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.getByText('No tickets yet.')).not.toBeNull();
    });

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'missing ticket' } });

    await waitFor(() => {
      expect(screen.getByText('No tickets match these filters.')).not.toBeNull();
      expect(screen.getByText('Search: missing ticket')).not.toBeNull();
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

  it('shows inline assignee control in the ticket list for users who can manage tickets', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }
      if (path.includes('/members/assignable')) {
        return {
          data: [{ id: 1, user: { id: 22, first_name: 'Ava', last_name: 'Agent', email: 'ava@example.test' } }],
        } as never;
      }
      if (path === '/workspaces/acme/saved-views') {
        return { data: [] } as never;
      }
      if (path.startsWith('/workspaces/acme/tickets')) {
        return {
          data: [
            {
              id: 7,
              customer_id: 10,
              ticket_number: 'TKT-000007',
              title: 'Branch outage',
              description: 'Router offline',
              status: 'open',
              priority: 'high',
              assigned_to_user_id: null,
              assignee: null,
              customer: { id: 10, name: 'Acme Corp', email: 'help@acme.test' },
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Assign TKT-000007')).not.toBeNull();
    });
  });

  it('saves current filters as a saved view', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'network outage' } });
    const controlsButton = screen
      .getAllByRole('button', { name: /Views & Filters/i })
      .find((button) => button.textContent?.includes('(1)'));
    if (!controlsButton) throw new Error('Views & Filters trigger not found');
    fireEvent.click(controlsButton);
    await waitFor(() => {
      expect(screen.getByLabelText('New view name')).not.toBeNull();
    });
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
            queueKey: 'all',
            category: 'all',
            customerId: 'all',
            assigneeId: 'all',
            page: 1,
          },
        }),
      });
    });
  });

  it('submits dictionary-backed fields and custom field values in edit flow', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path.includes('/customers?per_page=200')) {
        return { data: [{ id: 10, name: 'Acme Corp' }], meta: { current_page: 1, last_page: 1, per_page: 200, total: 1 } } as never;
      }
      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }
      if (path === '/workspaces/acme/saved-views') {
        return { data: [] } as never;
      }
      if (path === '/workspaces/acme/ticket-queues') {
        return { data: [{ id: 1, key: 'ops', name: 'Operations', is_active: true, is_default: true, sort_order: 1 }] } as never;
      }
      if (path === '/workspaces/acme/ticket-categories') {
        return { data: [{ id: 2, key: 'incident', name: 'Incident', is_active: true, sort_order: 1 }] } as never;
      }
      if (path === '/workspaces/acme/ticket-tags') {
        return { data: [{ id: 3, name: 'network', is_active: true }] } as never;
      }
      if (path === '/workspaces/acme/ticket-custom-fields') {
        return {
          data: [
            {
              id: 10,
              key: 'asset_id',
              label: 'Asset ID',
              field_type: 'text',
              options: [],
              is_required: false,
              is_active: true,
              sort_order: 1,
            },
            {
              id: 11,
              key: 'location_code',
              label: 'Location Code',
              field_type: 'text',
              options: [],
              is_required: false,
              is_active: true,
              sort_order: 2,
            },
          ],
        } as never;
      }
      if (path === '/workspaces/acme/ticket-form-templates') {
        return {
          data: [
            {
              id: 50,
              name: 'Incident Intake',
              is_active: true,
              is_default: true,
              ticket_type_id: null,
              field_schema: [{ key: 'asset_id', required: false }],
              visibility_rules: [],
              required_rules: [],
            },
          ],
        } as never;
      }
      if (path === '/workspaces/acme/tickets?page=1') {
        return {
          data: [
            {
              id: 7,
              customer_id: 10,
              ticket_number: 'TKT-000007',
              title: 'Branch outage',
              description: 'Router offline',
              status: 'open',
              priority: 'high',
              assigned_to_user_id: null,
              queue_key: 'ops',
              category: 'incident',
              tags: ['network'],
              custom_fields: [
                { ticket_custom_field_id: 10, key: 'asset_id', value: 'A-100' },
                { ticket_custom_field_id: 11, key: 'location_code', value: 'LOC-1' },
              ],
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        } as never;
      }
      if (path === '/workspaces/acme/tickets/7' && init?.method === 'PATCH') {
        return { data: {} } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit' })).not.toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeNull();
    });

    expect(screen.queryByLabelText('Location Code')).toBeNull();
    fireEvent.change(screen.getByLabelText('Tags (comma separated)'), { target: { value: 'network, urgent' } });
    fireEvent.change(screen.getByLabelText('Asset ID'), { target: { value: 'A-200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/7', {
        method: 'PATCH',
        body: JSON.stringify({
          customer_id: 10,
          title: 'Branch outage',
          description: 'Router offline',
          status: 'open',
          priority: 'high',
          assigned_to_user_id: null,
          category: 'incident',
          queue_key: 'ops',
          tags: ['network', 'urgent'],
          custom_fields: { asset_id: 'A-200' },
        }),
      });
    });
  });
});
