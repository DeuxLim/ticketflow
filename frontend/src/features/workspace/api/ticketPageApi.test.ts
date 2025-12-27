import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import {
  bulkUpdateWorkspaceTickets,
  createWorkspaceTicket,
  deleteWorkspaceTicketById,
  listAssignableMembersForTickets,
  listRelatedTicketOptions,
  listTicketCustomersForSelectors,
  listWorkspaceTickets,
  updateWorkspaceTicketById,
} from './ticketPageApi';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('ticketPageApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ data: [] } as never);
  });

  it('uses bounded customer selector endpoint', async () => {
    await listTicketCustomersForSelectors('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers?per_page=200');
  });

  it('uses assignable-members endpoint for assignee selectors', async () => {
    await listAssignableMembersForTickets('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/members/assignable');
  });

  it('uses bounded ticket endpoint for related ticket options', async () => {
    await listRelatedTicketOptions('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets?per_page=200');
  });

  it('builds ticket list endpoint with filters and page', async () => {
    await listWorkspaceTickets('acme', {
      search: 'router',
      status: 'open',
      priority: 'high',
      queueKey: 'ops',
      category: 'incident',
      customerId: '10',
      assigneeId: '22',
      page: 3,
    });

    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets?search=router&status=open&priority=high&queue_key=ops&category=incident&customer_id=10&assignee_id=22&page=3');
  });

  it('creates, updates, bulk updates, and deletes tickets', async () => {
    await createWorkspaceTicket('acme', { title: 'Router down' });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets', {
      method: 'POST',
      body: JSON.stringify({ title: 'Router down' }),
    });

    await updateWorkspaceTicketById('acme', 9, { status: 'resolved' });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/9', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });

    await bulkUpdateWorkspaceTickets('acme', { ticket_ids: [1, 2], priority: 'high' });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ ticket_ids: [1, 2], priority: 'high' }),
    });

    await deleteWorkspaceTicketById('acme', 9);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/9', {
      method: 'DELETE',
    });
  });
});
