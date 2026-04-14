import { apiRequest } from '@/services/api/client';
import type { ApiPaginationMeta, Customer, Ticket } from '@/types/api';

export type ReportingOverview = {
  totals: {
    tickets: number;
    open: number;
    resolved: number;
  };
  backlog_by_priority: Record<string, number>;
};

export function listDashboardCustomers(workspaceSlug: string) {
  return apiRequest<{ data: Customer[]; meta: ApiPaginationMeta }>(`/workspaces/${workspaceSlug}/customers?per_page=1`);
}

export function listDashboardRecentTickets(workspaceSlug: string) {
  return apiRequest<{ data: Ticket[]; meta: ApiPaginationMeta }>(`/workspaces/${workspaceSlug}/tickets?per_page=5`);
}

export function getDashboardReportingOverview(workspaceSlug: string) {
  return apiRequest<{ data: ReportingOverview }>(`/workspaces/${workspaceSlug}/reports/overview`);
}
