import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import {
  getDashboardReportingOverview,
  listDashboardCustomers,
  listDashboardRecentTickets,
} from './workspaceDashboardApi';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('workspaceDashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ data: {} } as never);
  });

  it('lists dashboard customers with bounded page size', async () => {
    await listDashboardCustomers('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers?per_page=1');
  });

  it('lists dashboard recent tickets with bounded page size', async () => {
    await listDashboardRecentTickets('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/tickets?per_page=5');
  });

  it('loads reporting overview', async () => {
    await getDashboardReportingOverview('acme');
    expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/reports/overview');
  });
});
