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
    });

    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.test',
        company: null,
        phone: null,
      }),
    });
  });

  it('updates customer', async () => {
    await updateWorkspaceCustomer('acme', 12, {
      name: 'John Updated',
      email: null,
      company: 'Acme',
      phone: '123',
    });

    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers/12', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'John Updated',
        email: null,
        company: 'Acme',
        phone: '123',
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
