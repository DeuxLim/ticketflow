import { apiRequest } from '@/services/api/client';
import type { Ticket } from '@/types/api';

type TicketComment = {
  id: number;
};

type TicketActivity = {
  id: number;
};

type TicketAttachment = {
  id: number;
};

export function getWorkspaceTicket(workspaceSlug: string, ticketId: string) {
  return apiRequest<{ data: Ticket }>(`/workspaces/${workspaceSlug}/tickets/${ticketId}`);
}

export function updateWorkspaceTicket(workspaceSlug: string, ticketId: string, payload: Record<string, unknown>) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function transitionWorkspaceTicket(workspaceSlug: string, ticketId: string, toStatus: string) {
  return apiRequest<{ data: Ticket; message?: string }>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/transition`, {
    method: 'POST',
    body: JSON.stringify({ to_status: toStatus }),
  });
}

export function uploadWorkspaceTicketAttachment(workspaceSlug: string, ticketId: string, formData: FormData) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/attachments`, {
    method: 'POST',
    body: formData,
  });
}

export function listWorkspaceTicketComments(workspaceSlug: string, ticketId: string) {
  return apiRequest<{ data: TicketComment[] }>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/comments`);
}

export function listWorkspaceTicketActivity(workspaceSlug: string, ticketId: string) {
  return apiRequest<{ data: TicketActivity[] }>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/activity`);
}

export function listWorkspaceTicketAttachments(workspaceSlug: string, ticketId: string) {
  return apiRequest<{ data: TicketAttachment[] }>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/attachments`);
}

export function createWorkspaceTicketComment(
  workspaceSlug: string,
  ticketId: string,
  payload: { body: string; is_internal: boolean },
) {
  return apiRequest<{ data: TicketComment }>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceTicketComment(
  workspaceSlug: string,
  ticketId: string,
  commentId: number,
  payload: { body: string },
) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspaceTicketComment(workspaceSlug: string, ticketId: string, commentId: number) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

export function deleteWorkspaceTicketAttachment(workspaceSlug: string, ticketId: string, attachmentId: number) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/attachments/${attachmentId}`, { method: 'DELETE' });
}

export function addWorkspaceTicketWatcher(workspaceSlug: string, ticketId: string) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/watchers`, { method: 'POST' });
}

export function removeWorkspaceTicketWatcher(workspaceSlug: string, ticketId: string, watcherId: number) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/watchers/${watcherId}`, { method: 'DELETE' });
}

export function createWorkspaceChecklistItem(workspaceSlug: string, ticketId: string, payload: { title: string }) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/checklist-items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceChecklistItem(workspaceSlug: string, ticketId: string, itemId: number, payload: Record<string, unknown>) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/checklist-items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspaceChecklistItem(workspaceSlug: string, ticketId: string, itemId: number) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/checklist-items/${itemId}`, { method: 'DELETE' });
}

export function reorderWorkspaceChecklistItems(
  workspaceSlug: string,
  ticketId: string,
  items: Array<{ id: number; sort_order: number }>,
) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/checklist-items/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

export function createWorkspaceRelatedTicket(workspaceSlug: string, ticketId: string, payload: { related_ticket_id: number; relationship_type: string }) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/related-tickets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspaceRelatedTicket(workspaceSlug: string, ticketId: string, linkId: number) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}/related-tickets/${linkId}`, { method: 'DELETE' });
}

export function deleteWorkspaceTicket(workspaceSlug: string, ticketId: string) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}`, { method: 'DELETE' });
}
