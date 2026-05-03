import { apiRequest } from '@/services/api/client';
import type { ApiPaginationMeta, Customer, Ticket } from '@/types/api';

export type MemberOption = {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
};

export function listTicketCustomersForSelectors(workspaceSlug: string) {
  return apiRequest<{ data: Customer[]; meta: ApiPaginationMeta }>(`/workspaces/${workspaceSlug}/customers?per_page=200`);
}

export function listAssignableMembersForTickets(workspaceSlug: string) {
  return apiRequest<{ data: MemberOption[] }>(`/workspaces/${workspaceSlug}/members/assignable`);
}

export function listRelatedTicketOptions(workspaceSlug: string) {
  return apiRequest<{ data: Ticket[]; meta: ApiPaginationMeta }>(`/workspaces/${workspaceSlug}/tickets?per_page=200`);
}

type TicketListFilters = {
  search?: string;
  status?: string;
  priority?: string;
  queueKey?: string;
  category?: string;
  customerId?: string;
  assigneeId?: string;
  page?: number;
};

export function listWorkspaceTickets(workspaceSlug: string, filters: TicketListFilters) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
  if (filters.queueKey && filters.queueKey !== 'all') params.set('queue_key', filters.queueKey);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.customerId && filters.customerId !== 'all') params.set('customer_id', filters.customerId);
  if (filters.assigneeId && filters.assigneeId !== 'all') params.set('assignee_id', filters.assigneeId);
  params.set('page', String(filters.page ?? 1));

  return apiRequest<{ data: Ticket[]; meta: ApiPaginationMeta }>(`/workspaces/${workspaceSlug}/tickets?${params.toString()}`);
}

export function createWorkspaceTicket(workspaceSlug: string, payload: Record<string, unknown>) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceTicketById(workspaceSlug: string, ticketId: number, payload: Record<string, unknown>) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function bulkUpdateWorkspaceTickets(workspaceSlug: string, payload: Record<string, unknown>) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/bulk`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspaceTicketById(workspaceSlug: string, ticketId: number) {
  return apiRequest(`/workspaces/${workspaceSlug}/tickets/${ticketId}`, {
    method: 'DELETE',
  });
}
