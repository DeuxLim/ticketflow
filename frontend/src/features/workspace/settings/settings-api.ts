import { apiRequest } from '@/services/api/client';
import type {
  ApprovalRecord,
  ApiEnvelope,
  AuditEventRecord,
  AutomationExecutionLog,
  AutomationRuleConfig,
  BreakGlassRecord,
  RetentionPolicyConfig,
  TenantExportRecord,
  TenantIdentityProviderConfig,
  TenantSecurityPolicyConfig,
  ProvisioningDirectoryRecord,
  WebhookDeliveryRecord,
  WebhookEndpointRecord,
  TicketWorkflowConfig,
  TicketCategoryConfig,
  TicketCustomFieldConfig,
  TicketFormTemplateConfig,
  TicketQueueConfig,
  TicketTagConfig,
  TicketTypeConfig,
  WorkspaceGeneralSettings,
  WorkspaceTicketingSettings,
} from '@/types/api';

type GeneralSettingsPayload = {
  name?: string;
  timezone?: string;
  branding?: Record<string, unknown>;
  business_profile?: Record<string, unknown>;
};

type TicketingSettingsPayload = {
  ticket_number_format?: string;
  assignment_strategy?: WorkspaceTicketingSettings['assignment_strategy'];
  ticketing?: Record<string, unknown>;
};

export function getGeneralSettings(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<WorkspaceGeneralSettings>>(`/workspaces/${workspaceSlug}/settings/general`);
}

export function updateGeneralSettings(workspaceSlug: string, payload: GeneralSettingsPayload) {
  return apiRequest<ApiEnvelope<WorkspaceGeneralSettings>>(`/workspaces/${workspaceSlug}/settings/general`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getTicketingSettings(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<WorkspaceTicketingSettings>>(`/workspaces/${workspaceSlug}/settings/ticketing`);
}

export function updateTicketingSettings(workspaceSlug: string, payload: TicketingSettingsPayload) {
  return apiRequest<ApiEnvelope<WorkspaceTicketingSettings>>(`/workspaces/${workspaceSlug}/settings/ticketing`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listTicketQueues(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TicketQueueConfig[]>>(`/workspaces/${workspaceSlug}/ticket-queues`);
}

export function createTicketQueue(workspaceSlug: string, payload: Partial<TicketQueueConfig>) {
  return apiRequest<ApiEnvelope<TicketQueueConfig>>(`/workspaces/${workspaceSlug}/ticket-queues`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTicketQueue(workspaceSlug: string, id: number, payload: Partial<TicketQueueConfig>) {
  return apiRequest<ApiEnvelope<TicketQueueConfig>>(`/workspaces/${workspaceSlug}/ticket-queues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listTicketCategories(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TicketCategoryConfig[]>>(`/workspaces/${workspaceSlug}/ticket-categories`);
}

export function createTicketCategory(workspaceSlug: string, payload: Partial<TicketCategoryConfig>) {
  return apiRequest<ApiEnvelope<TicketCategoryConfig>>(`/workspaces/${workspaceSlug}/ticket-categories`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTicketCategory(workspaceSlug: string, id: number, payload: Partial<TicketCategoryConfig>) {
  return apiRequest<ApiEnvelope<TicketCategoryConfig>>(`/workspaces/${workspaceSlug}/ticket-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listTicketTags(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TicketTagConfig[]>>(`/workspaces/${workspaceSlug}/ticket-tags`);
}

export function createTicketTag(workspaceSlug: string, payload: Partial<TicketTagConfig>) {
  return apiRequest<ApiEnvelope<TicketTagConfig>>(`/workspaces/${workspaceSlug}/ticket-tags`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTicketTag(workspaceSlug: string, id: number, payload: Partial<TicketTagConfig>) {
  return apiRequest<ApiEnvelope<TicketTagConfig>>(`/workspaces/${workspaceSlug}/ticket-tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listTicketTypes(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TicketTypeConfig[]>>(`/workspaces/${workspaceSlug}/ticket-types`);
}

export function createTicketType(workspaceSlug: string, payload: Partial<TicketTypeConfig>) {
  return apiRequest<ApiEnvelope<TicketTypeConfig>>(`/workspaces/${workspaceSlug}/ticket-types`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTicketType(workspaceSlug: string, id: number, payload: Partial<TicketTypeConfig>) {
  return apiRequest<ApiEnvelope<TicketTypeConfig>>(`/workspaces/${workspaceSlug}/ticket-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listTicketCustomFields(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TicketCustomFieldConfig[]>>(`/workspaces/${workspaceSlug}/ticket-custom-fields`);
}

export function createTicketCustomField(workspaceSlug: string, payload: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<TicketCustomFieldConfig>>(`/workspaces/${workspaceSlug}/ticket-custom-fields`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTicketCustomField(workspaceSlug: string, id: number, payload: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<TicketCustomFieldConfig>>(`/workspaces/${workspaceSlug}/ticket-custom-fields/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listTicketFormTemplates(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TicketFormTemplateConfig[]>>(`/workspaces/${workspaceSlug}/ticket-form-templates`);
}

export function createTicketFormTemplate(workspaceSlug: string, payload: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<TicketFormTemplateConfig>>(`/workspaces/${workspaceSlug}/ticket-form-templates`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTicketFormTemplate(workspaceSlug: string, id: number, payload: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<TicketFormTemplateConfig>>(`/workspaces/${workspaceSlug}/ticket-form-templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listWorkflows(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TicketWorkflowConfig[]>>(`/workspaces/${workspaceSlug}/workflows`);
}

export function createWorkflow(workspaceSlug: string, payload: {
  name: string;
  is_default?: boolean;
  transitions: Array<{
    from_status: string;
    to_status: string;
    required_permission?: string | null;
    requires_approval?: boolean;
    sort_order?: number;
  }>;
}) {
  return apiRequest<ApiEnvelope<TicketWorkflowConfig>>(`/workspaces/${workspaceSlug}/workflows`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkflow(workspaceSlug: string, workflowId: number, payload: {
  name?: string;
  is_active?: boolean;
  is_default?: boolean;
}) {
  return apiRequest<ApiEnvelope<TicketWorkflowConfig>>(`/workspaces/${workspaceSlug}/workflows/${workflowId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function activateWorkflow(workspaceSlug: string, workflowId: number) {
  return apiRequest<ApiEnvelope<TicketWorkflowConfig>>(`/workspaces/${workspaceSlug}/workflows/${workflowId}/activate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

type WorkflowSimulationResponse = {
  data: {
    allowed: boolean;
    reason: string | null;
    requires_approval: boolean;
    required_permission: string | null;
    approver_mode: 'role' | 'users' | null;
    approval_timeout_minutes: number | null;
  };
};

export function simulateWorkflowTransition(workspaceSlug: string, ticketId: number, toStatus: string) {
  return apiRequest<WorkflowSimulationResponse>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/workflow/simulate`, {
    method: 'POST',
    body: JSON.stringify({ to_status: toStatus }),
  });
}

export function listAutomationRules(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<AutomationRuleConfig[]>>(`/workspaces/${workspaceSlug}/automation-rules`);
}

export function createAutomationRule(workspaceSlug: string, payload: {
  name: string;
  event_type: string;
  priority?: number;
  conditions?: unknown[];
  actions: unknown[];
  is_active?: boolean;
}) {
  return apiRequest<ApiEnvelope<AutomationRuleConfig>>(`/workspaces/${workspaceSlug}/automation-rules`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAutomationRule(workspaceSlug: string, ruleId: number, payload: {
  name?: string;
  event_type?: string;
  priority?: number;
  is_active?: boolean;
  conditions?: unknown[];
  actions?: unknown[];
}) {
  return apiRequest<ApiEnvelope<AutomationRuleConfig>>(`/workspaces/${workspaceSlug}/automation-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function toggleAutomationRule(workspaceSlug: string, ruleId: number, isActive: boolean) {
  return apiRequest<ApiEnvelope<AutomationRuleConfig>>(`/workspaces/${workspaceSlug}/automation-rules/${ruleId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function testAutomationRule(workspaceSlug: string, ruleId: number, ticketId: number) {
  return apiRequest<{ data: Record<string, unknown> | null }>(`/workspaces/${workspaceSlug}/automation-rules/${ruleId}/test`, {
    method: 'POST',
    body: JSON.stringify({ ticket_id: ticketId }),
  });
}

export function listAutomationExecutions(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<AutomationExecutionLog[]>>(`/workspaces/${workspaceSlug}/automation-executions`);
}

export function listApprovals(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<ApprovalRecord[]>>(`/workspaces/${workspaceSlug}/approvals?status=pending`);
}

export function approveApproval(workspaceSlug: string, approvalId: number, reason = 'Approved from settings') {
  return apiRequest<ApiEnvelope<ApprovalRecord>>(`/workspaces/${workspaceSlug}/approvals/${approvalId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function rejectApproval(workspaceSlug: string, approvalId: number, reason: string) {
  return apiRequest<ApiEnvelope<ApprovalRecord>>(`/workspaces/${workspaceSlug}/approvals/${approvalId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function getRetentionPolicy(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<RetentionPolicyConfig>>(`/workspaces/${workspaceSlug}/retention-policies`);
}

export function updateRetentionPolicy(workspaceSlug: string, payload: Partial<RetentionPolicyConfig>) {
  return apiRequest<ApiEnvelope<RetentionPolicyConfig>>(`/workspaces/${workspaceSlug}/retention-policies`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listExports(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TenantExportRecord[]>>(`/workspaces/${workspaceSlug}/exports`);
}

export function createExport(workspaceSlug: string, include: string[]) {
  return apiRequest<ApiEnvelope<TenantExportRecord>>(`/workspaces/${workspaceSlug}/exports`, {
    method: 'POST',
    body: JSON.stringify({ include }),
  });
}

export function listBreakGlassRequests(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<BreakGlassRecord[]>>(`/workspaces/${workspaceSlug}/break-glass/requests`);
}

export function createBreakGlassRequest(workspaceSlug: string, reason: string, durationMinutes: number) {
  return apiRequest<ApiEnvelope<BreakGlassRecord>>(`/workspaces/${workspaceSlug}/break-glass/requests`, {
    method: 'POST',
    body: JSON.stringify({ reason, duration_minutes: durationMinutes }),
  });
}

export function listAuditEvents(workspaceSlug: string) {
  return apiRequest<{ data: AuditEventRecord[] }>(`/workspaces/${workspaceSlug}/audit-events?per_page=20`);
}

type OidcStartResponse = {
  data: {
    authorization_url: string;
    state: string;
  };
};

type CreateProvisioningDirectoryResponse = ApiEnvelope<ProvisioningDirectoryRecord> & {
  meta?: {
    token?: string;
  };
};

export function getTenantSecurityPolicy(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TenantSecurityPolicyConfig>>(`/workspaces/${workspaceSlug}/security-policy`);
}

export function updateTenantSecurityPolicy(workspaceSlug: string, payload: Partial<TenantSecurityPolicyConfig>) {
  return apiRequest<ApiEnvelope<TenantSecurityPolicyConfig>>(`/workspaces/${workspaceSlug}/security-policy`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listIdentityProviders(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<TenantIdentityProviderConfig[]>>(`/workspaces/${workspaceSlug}/identity-providers`);
}

export function createIdentityProvider(workspaceSlug: string, payload: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<TenantIdentityProviderConfig>>(`/workspaces/${workspaceSlug}/identity-providers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteIdentityProvider(workspaceSlug: string, providerId: number) {
  return apiRequest<{ message: string }>(`/workspaces/${workspaceSlug}/identity-providers/${providerId}`, {
    method: 'DELETE',
  });
}

export function startOidcSso(workspaceSlug: string, providerId: number) {
  return apiRequest<OidcStartResponse>(`/workspaces/${workspaceSlug}/auth/sso/oidc/start`, {
    method: 'POST',
    body: JSON.stringify({ provider_id: providerId }),
  });
}

export function listProvisioningDirectories(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<ProvisioningDirectoryRecord[]>>(`/workspaces/${workspaceSlug}/provisioning-directories`);
}

export function createProvisioningDirectory(workspaceSlug: string, name: string) {
  return apiRequest<CreateProvisioningDirectoryResponse>(`/workspaces/${workspaceSlug}/provisioning-directories`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

type CreateWebhookEndpointPayload = {
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active?: boolean;
};

type WebhookDeliveriesResponse = {
  data: WebhookDeliveryRecord[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

export function listWebhookEndpoints(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<WebhookEndpointRecord[]>>(`/workspaces/${workspaceSlug}/webhooks`);
}

export function createWebhookEndpoint(workspaceSlug: string, payload: CreateWebhookEndpointPayload) {
  return apiRequest<ApiEnvelope<WebhookEndpointRecord>>(`/workspaces/${workspaceSlug}/webhooks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listWebhookDeliveries(workspaceSlug: string) {
  return apiRequest<WebhookDeliveriesResponse>(`/workspaces/${workspaceSlug}/webhook-deliveries`);
}

export function retryWebhookDelivery(workspaceSlug: string, deliveryId: number) {
  return apiRequest<ApiEnvelope<WebhookDeliveryRecord>>(`/workspaces/${workspaceSlug}/webhook-deliveries/${deliveryId}/retry`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
