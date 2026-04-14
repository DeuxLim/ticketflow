import { apiRequest } from '@/services/api/client';
import type { ApiEnvelope, Customer } from '@/types/api';

export function listWorkspaceCustomers(workspaceSlug: string, search?: string) {
  const query = search?.trim();
  const path = query
    ? `/workspaces/${workspaceSlug}/customers?search=${encodeURIComponent(query)}`
    : `/workspaces/${workspaceSlug}/customers`;

  return apiRequest<ApiEnvelope<Customer[]>>(path);
}

export function createWorkspaceCustomer(workspaceSlug: string, payload: {
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
}) {
  return apiRequest(`/workspaces/${workspaceSlug}/customers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceCustomer(workspaceSlug: string, customerId: number, payload: {
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
}) {
  return apiRequest(`/workspaces/${workspaceSlug}/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspaceCustomer(workspaceSlug: string, customerId: number) {
  return apiRequest<{ message: string }>(`/workspaces/${workspaceSlug}/customers/${customerId}`, {
    method: 'DELETE',
  });
}
