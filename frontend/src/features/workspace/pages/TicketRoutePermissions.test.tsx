// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest } from '@/services/api/client';
import { TicketDetailsPage } from './TicketDetailsPage';
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
  apiDownload: vi.fn(),
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

function mockAccess(canView: boolean, canManage: boolean) {
  vi.mocked(useWorkspaceAccess).mockReturnValue({
    isLoading: false,
    can: (permission: string) => {
      if (permission === 'tickets.view') return canView;
      if (permission === 'tickets.manage') return canManage;
      return false;
    },
  } as ReturnType<typeof useWorkspaceAccess>);
}

describe('ticket route permission states', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path.includes('/tickets')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } } as never;
      }
      if (path.includes('/customers')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }
      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }
      return { data: [] } as never;
    });
  });

  it('shows forbidden state on tickets list when tickets.view is missing', async () => {
    mockAccess(false, false);

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
      '/workspaces/acme/tickets',
    );

    await waitFor(() => {
      expect(screen.getByText('Tickets unavailable')).not.toBeNull();
      expect(screen.getByText(/tickets.view permission/i)).not.toBeNull();
    });
  });

  it('disables create action when user can view but cannot manage tickets', async () => {
    mockAccess(true, false);

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
      </Routes>,
      '/workspaces/acme/tickets',
    );

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: 'Create Ticket' });
      expect(createButton.getAttribute('disabled')).not.toBeNull();
    });
  });

  it('shows forbidden state on ticket details when tickets.view is missing', async () => {
    mockAccess(false, false);

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
      '/workspaces/acme/tickets/123',
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket details unavailable')).not.toBeNull();
      expect(screen.getByText('You need the tickets.view permission to open ticket threads.')).not.toBeNull();
    });
  });

  it('keeps ticket lifecycle actions disabled for view-only roles on ticket details', async () => {
    mockAccess(true, false);

    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/auth/me') {
        return { data: { id: 1, email: 'viewer@example.test', is_platform_admin: false } } as never;
      }
      if (path === '/workspaces/acme/tickets/123') {
        return {
          data: {
            id: 123,
            workspace_id: 1,
            customer_id: 10,
            created_by_user_id: 1,
            assigned_to_user_id: null,
            ticket_number: 'TKT-000123',
            title: 'Router down',
            description: 'The branch router is offline.',
            status: 'open',
            priority: 'high',
            customer: { id: 10, name: 'Acme', email: 'support@acme.test' },
            assignee: null,
            creator: { id: 1, first_name: 'Owner', last_name: 'User', email: 'owner@example.test' },
            watchers: [],
            related_tickets: [],
            checklist_items: [],
            custom_fields: [],
            created_at: '2026-04-14T00:00:00Z',
            updated_at: '2026-04-14T00:00:00Z',
          },
        } as never;
      }
      if (path.includes('/comments') || path.includes('/activity') || path.includes('/attachments')) {
        return { data: [] } as never;
      }
      if (path.includes('/customers')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }
      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }
      if (path.includes('/tickets?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }
      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
      '/workspaces/acme/tickets/123',
    );

    await waitFor(() => {
      expect(screen.getByText('Router down')).not.toBeNull();
    });

    expect(screen.getByRole('button', { name: /Move to in progress/i }).getAttribute('disabled')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Edit Ticket' }).getAttribute('disabled')).not.toBeNull();
  });
});
