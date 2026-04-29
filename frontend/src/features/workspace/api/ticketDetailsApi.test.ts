import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import {
  addWorkspaceTicketWatcher,
  createWorkspaceChecklistItem,
  createWorkspaceRelatedTicket,
  createWorkspaceTicketComment,
  deleteWorkspaceChecklistItem,
  deleteWorkspaceTicketComment,
  deleteWorkspaceTicket,
  deleteWorkspaceTicketAttachment,
  deleteWorkspaceRelatedTicket,
  getWorkspaceTicket,
  listWorkspaceTicketActivity,
  listWorkspaceTicketAttachments,
  listWorkspaceTicketComments,
  removeWorkspaceTicketWatcher,
  reorderWorkspaceChecklistItems,
  transitionWorkspaceTicket,
  updateWorkspaceChecklistItem,
  updateWorkspaceTicketComment,
  updateWorkspaceTicket,
  uploadWorkspaceTicketAttachment,
} from './ticketDetailsApi';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('ticketDetailsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ data: {} } as never);
  });

  it('calls get ticket endpoint', async () => {
    await getWorkspaceTicket('acme', '123');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123');
  });

  it('calls update ticket endpoint with patch payload', async () => {
    await updateWorkspaceTicket('acme', '123', { status: 'resolved' });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });
  });

  it('calls transition endpoint with target status', async () => {
    await transitionWorkspaceTicket('acme', '123', 'closed');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/transition', {
      method: 'POST',
      body: JSON.stringify({ to_status: 'closed' }),
    });
  });

  it('calls attachment upload endpoint with form data', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

    await uploadWorkspaceTicketAttachment('acme', '123', formData);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/attachments', {
      method: 'POST',
      body: formData,
    });
  });

  it('lists comments, activity, and attachments', async () => {
    await listWorkspaceTicketComments('acme', '123');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/comments');

    await listWorkspaceTicketActivity('acme', '123');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/activity');

    await listWorkspaceTicketAttachments('acme', '123');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/attachments');
  });

  it('creates, updates, and deletes ticket comments', async () => {
    await createWorkspaceTicketComment('acme', '123', { body: 'Hello', is_internal: true });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/comments', {
      method: 'POST',
      body: JSON.stringify({ body: 'Hello', is_internal: true }),
    });

    await updateWorkspaceTicketComment('acme', '123', 9, { body: 'Updated' });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/comments/9', {
      method: 'PATCH',
      body: JSON.stringify({ body: 'Updated' }),
    });

    await deleteWorkspaceTicketComment('acme', '123', 9);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/comments/9', {
      method: 'DELETE',
    });
  });

  it('handles attachments, watchers, checklist, related-ticket, and ticket delete endpoints', async () => {
    await deleteWorkspaceTicketAttachment('acme', '123', 88);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/attachments/88', { method: 'DELETE' });

    await addWorkspaceTicketWatcher('acme', '123');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/watchers', { method: 'POST' });

    await removeWorkspaceTicketWatcher('acme', '123', 7);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/watchers/7', { method: 'DELETE' });

    await createWorkspaceChecklistItem('acme', '123', { title: 'Call customer' });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/checklist-items', {
      method: 'POST',
      body: JSON.stringify({ title: 'Call customer' }),
    });

    await updateWorkspaceChecklistItem('acme', '123', 4, { is_completed: true });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/checklist-items/4', {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: true }),
    });

    await reorderWorkspaceChecklistItems('acme', '123', [
      { id: 4, sort_order: 0 },
      { id: 5, sort_order: 1 },
    ]);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/checklist-items/reorder', {
      method: 'PATCH',
      body: JSON.stringify({
        items: [
          { id: 4, sort_order: 0 },
          { id: 5, sort_order: 1 },
        ],
      }),
    });

    await deleteWorkspaceChecklistItem('acme', '123', 4);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/checklist-items/4', { method: 'DELETE' });

    await createWorkspaceRelatedTicket('acme', '123', { related_ticket_id: 9, relationship_type: 'blocked_by' });
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/related-tickets', {
      method: 'POST',
      body: JSON.stringify({ related_ticket_id: 9, relationship_type: 'blocked_by' }),
    });

    await deleteWorkspaceRelatedTicket('acme', '123', 22);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123/related-tickets/22', { method: 'DELETE' });

    await deleteWorkspaceTicket('acme', '123');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets/123', { method: 'DELETE' });
  });
});
