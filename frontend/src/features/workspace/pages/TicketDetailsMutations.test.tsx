// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest } from '@/services/api/client';
import { TicketDetailsPage } from './TicketDetailsPage';

vi.mock('@/hooks/use-workspace-access', () => ({
  useWorkspaceAccess: vi.fn(),
}));

vi.mock('@/services/api/client', () => ({
  ApiError: class extends Error {
    status: number;
    fieldErrors: Record<string, string[]>;

    constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
      super(message);
      this.status = status;
      this.fieldErrors = fieldErrors;
    }
  },
  apiRequest: vi.fn(),
  apiDownload: vi.fn(),
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
      <MemoryRouter initialEntries={['/workspaces/acme/tickets/123']}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAccess(canView = true, canManage = true, canComment = true) {
  vi.mocked(useWorkspaceAccess).mockReturnValue({
    isLoading: false,
    can: (permission: string) => {
      if (permission === 'tickets.view') return canView;
      if (permission === 'tickets.manage') return canManage;
      if (permission === 'tickets.comment') return canComment;
      return false;
    },
  } as ReturnType<typeof useWorkspaceAccess>);
}

function buildTicket(status: 'open' | 'in_progress' | 'resolved' | 'closed' = 'open') {
  return {
    id: 123,
    workspace_id: 1,
    customer_id: 10,
    created_by_user_id: 1,
    assigned_to_user_id: null,
    ticket_number: 'TKT-000123',
    title: 'Router down',
    description: 'The branch router is offline.',
    status,
    priority: 'high',
    customer: { id: 10, name: 'Acme', email: 'support@acme.test' },
    assignee: null,
    creator: { id: 1, first_name: 'Owner', last_name: 'User', email: 'owner@example.test' },
    watchers: [],
    related_tickets: [],
    checklist_items: [],
    custom_fields: [],
    state_summary: {
      assignment: { strategy: 'round_robin' },
      approval: { pending_count: 0, latest_status: null },
      automation: { recent_count: 0 },
      sla: { status: 'healthy' },
    },
    created_at: '2026-04-14T00:00:00Z',
    updated_at: '2026-04-14T00:00:00Z',
  };
}

describe('TicketDetailsPage mutations', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess(true, true, true);

    vi.mocked(apiRequest).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/auth/me') {
        return { data: { id: 1, email: 'owner@example.test', is_platform_admin: false } } as never;
      }

      if (path === '/workspaces/acme/tickets/123') {
        return { data: buildTicket('open') } as never;
      }

      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }

      if (path.includes('/tickets?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.endsWith('/attachments') && init?.method === 'POST') {
        throw new Error('Attachment upload failed.');
      }

      if (path.endsWith('/comments') || path.endsWith('/activity') || path.endsWith('/attachments')) {
        return { data: [] } as never;
      }

      return { data: [] } as never;
    });
  });

  it('shows upload error when attachment upload fails', async () => {
    const view = renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Ticket Summary').length).toBeGreaterThan(0);
    });

    const fileInput = view.container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();
    const file = new File(['test-content'], 'error.txt', { type: 'text/plain' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(screen.getByText('Attachment upload failed.')).not.toBeNull();
    });
  });

  it('falls back to direct status update when transition endpoint returns 422', async () => {
    const ApiError = (await import('@/services/api/client')).ApiError;

    vi.mocked(apiRequest).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/auth/me') {
        return { data: { id: 1, email: 'owner@example.test', is_platform_admin: false } } as never;
      }

      if (path === '/workspaces/acme/tickets/123') {
        if (init?.method === 'PATCH') {
          return { data: buildTicket('in_progress') } as never;
        }

        return { data: buildTicket('open') } as never;
      }

      if (path === '/workspaces/acme/tickets/123/transition') {
        throw new ApiError('Approval required', 422);
      }

      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }

      if (path.includes('/tickets?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.endsWith('/comments') || path.endsWith('/activity') || path.endsWith('/attachments')) {
        return { data: [] } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Ticket Summary').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /Move to in progress/i }));

    await waitFor(() => {
      expect(
        vi.mocked(apiRequest).mock.calls.some(
          ([path]) => path === '/workspaces/acme/tickets/123/transition',
        ),
      ).toBe(true);
      expect(
        vi.mocked(apiRequest).mock.calls.some(
          ([path, init]) =>
            path === '/workspaces/acme/tickets/123' &&
            (init as RequestInit | undefined)?.method === 'PATCH' &&
            String((init as RequestInit | undefined)?.body).includes('"status":"in_progress"'),
        ),
      ).toBe(true);
    });
  });

  it('renders quick transition message when backend returns one', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/auth/me') {
        return { data: { id: 1, email: 'owner@example.test', is_platform_admin: false } } as never;
      }

      if (path === '/workspaces/acme/tickets/123') {
        return { data: buildTicket('open') } as never;
      }

      if (path === '/workspaces/acme/tickets/123/transition') {
        return { data: buildTicket('in_progress'), message: 'Approval request submitted.' } as never;
      }

      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }

      if (path.includes('/tickets?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.endsWith('/comments') || path.endsWith('/activity') || path.endsWith('/attachments')) {
        return { data: [] } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Ticket Summary').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /Move to in progress/i }));

    await waitFor(() => {
      expect(screen.getByText('Approval request submitted.')).not.toBeNull();
    });
  });

  it('maps update validation errors to form fields in edit dialog', async () => {
    const ApiError = (await import('@/services/api/client')).ApiError;

    vi.mocked(apiRequest).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/auth/me') {
        return { data: { id: 1, email: 'owner@example.test', is_platform_admin: false } } as never;
      }

      if (path === '/workspaces/acme/tickets/123') {
        if (init?.method === 'PATCH') {
          throw new ApiError('Validation failed.', 422, {
            title: ['Title already exists.'],
          });
        }

        return { data: buildTicket('open') } as never;
      }

      if (path.includes('/customers?per_page=200')) {
        return { data: [{ id: 10, name: 'Acme' }], meta: { current_page: 1, last_page: 1, per_page: 200, total: 1 } } as never;
      }

      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }

      if (path.includes('/tickets?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.endsWith('/comments') || path.endsWith('/activity') || path.endsWith('/attachments')) {
        return { data: [] } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Ticket Summary').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit Ticket' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeNull();
    });

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Router down duplicate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(screen.getByText('Title already exists.')).not.toBeNull();
    });
  });

  it('shows watcher error when follow action fails', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/auth/me') {
        return { data: { id: 1, email: 'owner@example.test', is_platform_admin: false } } as never;
      }

      if (path === '/workspaces/acme/tickets/123') {
        return { data: buildTicket('open') } as never;
      }

      if (path === '/workspaces/acme/tickets/123/watchers' && init?.method === 'POST') {
        throw new Error('Unable to follow this ticket right now.');
      }

      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }

      if (path.includes('/tickets?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.endsWith('/comments') || path.endsWith('/activity') || path.endsWith('/attachments')) {
        return { data: [] } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Ticket Summary').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Follow' }));

    await waitFor(() => {
      expect(screen.getByText('Unable to follow this ticket right now.')).not.toBeNull();
    });
  });

  it('shows checklist error when adding a task fails', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/auth/me') {
        return { data: { id: 1, email: 'owner@example.test', is_platform_admin: false } } as never;
      }

      if (path === '/workspaces/acme/tickets/123') {
        return { data: buildTicket('open') } as never;
      }

      if (path === '/workspaces/acme/tickets/123/checklist-items' && init?.method === 'POST') {
        throw new Error('Could not add checklist item.');
      }

      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }

      if (path.includes('/tickets?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.endsWith('/comments') || path.endsWith('/activity') || path.endsWith('/attachments')) {
        return { data: [] } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Ticket Summary').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByPlaceholderText('Add an operator task…'), {
      target: { value: 'Escalate to NOC' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }));

    await waitFor(() => {
      expect(screen.getByText('Could not add checklist item.')).not.toBeNull();
    });
  });

  it('shows related-ticket error when removing a related ticket fails', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/auth/me') {
        return { data: { id: 1, email: 'owner@example.test', is_platform_admin: false } } as never;
      }

      if (path === '/workspaces/acme/tickets/123') {
        return {
          data: {
            ...buildTicket('open'),
            related_tickets: [
              {
                id: 55,
                ticket_id: 123,
                related_ticket_id: 456,
                relationship_type: 'related',
                ticket: {
                  id: 456,
                  ticket_number: 'TKT-000456',
                  title: 'Upstream issue',
                },
              },
            ],
          },
        } as never;
      }

      if (path === '/workspaces/acme/tickets/123/related-tickets/55' && init?.method === 'DELETE') {
        throw new Error('Unable to remove related ticket.');
      }

      if (path.includes('/customers?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.includes('/members/assignable')) {
        return { data: [] } as never;
      }

      if (path.includes('/tickets?per_page=200')) {
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } } as never;
      }

      if (path.endsWith('/comments') || path.endsWith('/activity') || path.endsWith('/attachments')) {
        return { data: [] } as never;
      }

      return { data: [] } as never;
    });

    renderWithProviders(
      <Routes>
        <Route path="/workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Ticket Summary').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(screen.getByText('Unable to remove related ticket.')).not.toBeNull();
    });
  });
});
