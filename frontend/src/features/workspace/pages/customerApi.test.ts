import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import {
  createWorkspaceCustomer,
  deleteWorkspaceCustomer,
  listWorkspaceCustomers,
  updateWorkspaceCustomer,
} from './customerApi';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('customerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ data: [] } as never);
  });

  it('lists customers without search', async () => {
    await listWorkspaceCustomers('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers');
  });

  it('lists customers with encoded search', async () => {
    await listWorkspaceCustomers('acme', 'john doe');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers?search=john%20doe');
  });

  it('creates customer', async () => {
    await createWorkspaceCustomer('acme', {
      name: 'John Doe',
      email: 'john@example.test',
      company: null,
      phone: null,
      job_title: 'Operations Lead',
      website: 'https://example.test',
      timezone: 'Asia/Manila',
      preferred_contact_method: 'email',
      preferred_language: 'English',
      address: null,
      external_reference: 'CRM-1001',
      support_tier: 'enterprise',
      status: 'active',
      internal_notes: null,
    });

    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.test',
        company: null,
        phone: null,
        job_title: 'Operations Lead',
        website: 'https://example.test',
        timezone: 'Asia/Manila',
        preferred_contact_method: 'email',
        preferred_language: 'English',
        address: null,
        external_reference: 'CRM-1001',
        support_tier: 'enterprise',
        status: 'active',
        internal_notes: null,
      }),
    });
  });

  it('updates customer', async () => {
    await updateWorkspaceCustomer('acme', 12, {
      name: 'John Updated',
      email: null,
      company: 'Acme',
      phone: '123',
      job_title: null,
      website: null,
      timezone: null,
      preferred_contact_method: null,
      preferred_language: null,
      address: null,
      external_reference: null,
      support_tier: null,
      status: null,
      internal_notes: null,
    });

    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers/12', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'John Updated',
        email: null,
        company: 'Acme',
        phone: '123',
        job_title: null,
        website: null,
        timezone: null,
        preferred_contact_method: null,
        preferred_language: null,
        address: null,
        external_reference: null,
        support_tier: null,
        status: null,
        internal_notes: null,
      }),
    });
  });

  it('deletes customer', async () => {
    await deleteWorkspaceCustomer('acme', 12);
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers/12', {
      method: 'DELETE',
    });
  });
});
