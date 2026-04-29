import { apiRequest } from '@/services/api/client';
import type { ApiEnvelope, Customer } from '@/types/api';

export type CustomerPayload = {
  address: string | null;
  company: string | null;
  email: string | null;
  external_reference: string | null;
  internal_notes: string | null;
  job_title: string | null;
  name: string;
  phone: string | null;
  preferred_contact_method: string | null;
  preferred_language: string | null;
  status: string | null;
  support_tier: string | null;
  timezone: string | null;
  website: string | null;
};

export function listWorkspaceCustomers(workspaceSlug: string, search?: string) {
  const query = search?.trim();
  const path = query
    ? `/workspaces/${workspaceSlug}/customers?search=${encodeURIComponent(query)}`
    : `/workspaces/${workspaceSlug}/customers`;

  return apiRequest<ApiEnvelope<Customer[]>>(path);
}

export function createWorkspaceCustomer(workspaceSlug: string, payload: CustomerPayload) {
  return apiRequest(`/workspaces/${workspaceSlug}/customers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceCustomer(workspaceSlug: string, customerId: number, payload: CustomerPayload) {
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
