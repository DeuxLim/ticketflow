import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/services/api/client';
import {
  createTicketCustomField,
  createTicketFormTemplate,
  createTicketCategory,
  createTicketTag,
  createTicketType,
  createIdentityProvider,
  createAutomationRule,
  createWorkflow,
  createProvisioningDirectory,
  createWebhookEndpoint,
  deleteIdentityProvider,
  getTenantSecurityPolicy,
  listIdentityProviders,
  listWorkflows,
  listProvisioningDirectories,
  listWebhookDeliveries,
  listWebhookEndpoints,
  updateTicketCustomField,
  updateTicketFormTemplate,
  updateTicketCategory,
  updateTicketTag,
  updateTicketType,
  retryWebhookDelivery,
  simulateWorkflowTransition,
  startOidcSso,
  testAutomationRule,
  updateAutomationRule,
  updateWorkflow,
  updateTenantSecurityPolicy,
} from './settings-api';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('settings-api integrations and security contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ data: {} } as never);
  });

  it('calls integrations endpoints with expected methods and payloads', async () => {
    const workspaceSlug = 'acme';

    await listWebhookEndpoints(workspaceSlug);
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/workspaces/acme/webhooks');

    await createWebhookEndpoint(workspaceSlug, {
      name: 'Events',
      url: 'https://example.test/webhooks',
      secret: 'secret-123',
      events: ['ticket.created'],
      is_active: true,
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/workspaces/acme/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Events',
        url: 'https://example.test/webhooks',
        secret: 'secret-123',
        events: ['ticket.created'],
        is_active: true,
      }),
    });

    await listWebhookDeliveries(workspaceSlug);
    expect(apiRequest).toHaveBeenNthCalledWith(3, '/workspaces/acme/webhook-deliveries');

    await retryWebhookDelivery(workspaceSlug, 42);
    expect(apiRequest).toHaveBeenNthCalledWith(4, '/workspaces/acme/webhook-deliveries/42/retry', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  });

  it('calls security governance endpoints with expected methods and payloads', async () => {
    const workspaceSlug = 'acme';

    await getTenantSecurityPolicy(workspaceSlug);
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/workspaces/acme/security-policy');

    await updateTenantSecurityPolicy(workspaceSlug, {
      require_sso: true,
      require_mfa: true,
      session_ttl_minutes: 480,
      ip_allowlist: ['10.10.10.10'],
      tenant_mode: 'dedicated',
      dedicated_data_plane_key: 'dp-01',
      feature_flags: { advanced_routing: true },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/workspaces/acme/security-policy', {
      method: 'PATCH',
      body: JSON.stringify({
        require_sso: true,
        require_mfa: true,
        session_ttl_minutes: 480,
        ip_allowlist: ['10.10.10.10'],
        tenant_mode: 'dedicated',
        dedicated_data_plane_key: 'dp-01',
        feature_flags: { advanced_routing: true },
      }),
    });

    await listIdentityProviders(workspaceSlug);
    expect(apiRequest).toHaveBeenNthCalledWith(3, '/workspaces/acme/identity-providers');

    await createIdentityProvider(workspaceSlug, {
      provider_type: 'oidc',
      name: 'Okta OIDC',
      authorization_url: 'https://example.okta.com/oauth2/v1/authorize',
      token_url: 'https://example.okta.com/oauth2/v1/token',
      redirect_uri: 'https://app.example.com/auth/callback',
      client_id: 'client-123',
      client_secret: 'secret-123',
    });
    expect(apiRequest).toHaveBeenNthCalledWith(4, '/workspaces/acme/identity-providers', {
      method: 'POST',
      body: JSON.stringify({
        provider_type: 'oidc',
        name: 'Okta OIDC',
        authorization_url: 'https://example.okta.com/oauth2/v1/authorize',
        token_url: 'https://example.okta.com/oauth2/v1/token',
        redirect_uri: 'https://app.example.com/auth/callback',
        client_id: 'client-123',
        client_secret: 'secret-123',
      }),
    });

    await deleteIdentityProvider(workspaceSlug, 7);
    expect(apiRequest).toHaveBeenNthCalledWith(5, '/workspaces/acme/identity-providers/7', {
      method: 'DELETE',
    });

    await startOidcSso(workspaceSlug, 7);
    expect(apiRequest).toHaveBeenNthCalledWith(6, '/workspaces/acme/auth/sso/oidc/start', {
      method: 'POST',
      body: JSON.stringify({ provider_id: 7 }),
    });

    await listProvisioningDirectories(workspaceSlug);
    expect(apiRequest).toHaveBeenNthCalledWith(7, '/workspaces/acme/provisioning-directories');

    await createProvisioningDirectory(workspaceSlug, 'Azure AD');
    expect(apiRequest).toHaveBeenNthCalledWith(8, '/workspaces/acme/provisioning-directories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Azure AD' }),
    });
  });

  it('calls workflow and automation lifecycle endpoints with expected methods and payloads', async () => {
    const workspaceSlug = 'acme';

    await listWorkflows(workspaceSlug);
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/workspaces/acme/workflows');

    await createWorkflow(workspaceSlug, {
      name: 'Escalation Workflow',
      is_default: false,
      transitions: [
        {
          from_status: 'open',
          to_status: 'in_progress',
          required_permission: 'tickets.manage',
          requires_approval: false,
          sort_order: 0,
        },
      ],
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/workspaces/acme/workflows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Escalation Workflow',
        is_default: false,
        transitions: [
          {
            from_status: 'open',
            to_status: 'in_progress',
            required_permission: 'tickets.manage',
            requires_approval: false,
            sort_order: 0,
          },
        ],
      }),
    });

    await updateWorkflow(workspaceSlug, 9, { name: 'Updated Workflow', is_active: true });
    expect(apiRequest).toHaveBeenNthCalledWith(3, '/workspaces/acme/workflows/9', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Workflow', is_active: true }),
    });

    await simulateWorkflowTransition(workspaceSlug, 123, 'resolved');
    expect(apiRequest).toHaveBeenNthCalledWith(4, '/workspaces/acme/tickets/123/workflow/simulate', {
      method: 'POST',
      body: JSON.stringify({ to_status: 'resolved' }),
    });

    await createAutomationRule(workspaceSlug, {
      name: 'Escalate VIP',
      event_type: 'ticket.created',
      priority: 50,
      conditions: [],
      actions: [{ type: 'notify' }],
      is_active: true,
    });
    expect(apiRequest).toHaveBeenNthCalledWith(5, '/workspaces/acme/automation-rules', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Escalate VIP',
        event_type: 'ticket.created',
        priority: 50,
        conditions: [],
        actions: [{ type: 'notify' }],
        is_active: true,
      }),
    });

    await updateAutomationRule(workspaceSlug, 11, { name: 'Escalate VIP v2', priority: 10, is_active: false });
    expect(apiRequest).toHaveBeenNthCalledWith(6, '/workspaces/acme/automation-rules/11', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Escalate VIP v2', priority: 10, is_active: false }),
    });

    await testAutomationRule(workspaceSlug, 11, 123);
    expect(apiRequest).toHaveBeenNthCalledWith(7, '/workspaces/acme/automation-rules/11/test', {
      method: 'POST',
      body: JSON.stringify({ ticket_id: 123 }),
    });
  });

  it('calls ticket dictionary and form endpoints with expected methods and payloads', async () => {
    const workspaceSlug = 'acme';

    await createTicketCategory(workspaceSlug, { key: 'billing', name: 'Billing' });
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/workspaces/acme/ticket-categories', {
      method: 'POST',
      body: JSON.stringify({ key: 'billing', name: 'Billing' }),
    });

    await updateTicketCategory(workspaceSlug, 2, { name: 'Billing and Finance', is_active: true });
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/workspaces/acme/ticket-categories/2', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Billing and Finance', is_active: true }),
    });

    await createTicketType(workspaceSlug, { key: 'incident', name: 'Incident' });
    expect(apiRequest).toHaveBeenNthCalledWith(3, '/workspaces/acme/ticket-types', {
      method: 'POST',
      body: JSON.stringify({ key: 'incident', name: 'Incident' }),
    });

    await updateTicketType(workspaceSlug, 3, { name: 'Incident L2', is_active: false });
    expect(apiRequest).toHaveBeenNthCalledWith(4, '/workspaces/acme/ticket-types/3', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Incident L2', is_active: false }),
    });

    await createTicketTag(workspaceSlug, { name: 'vip' });
    expect(apiRequest).toHaveBeenNthCalledWith(5, '/workspaces/acme/ticket-tags', {
      method: 'POST',
      body: JSON.stringify({ name: 'vip' }),
    });

    await updateTicketTag(workspaceSlug, 4, { name: 'vip-priority', is_active: true });
    expect(apiRequest).toHaveBeenNthCalledWith(6, '/workspaces/acme/ticket-tags/4', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'vip-priority', is_active: true }),
    });

    await createTicketCustomField(workspaceSlug, { key: 'asset_id', label: 'Asset ID', field_type: 'text' });
    expect(apiRequest).toHaveBeenNthCalledWith(7, '/workspaces/acme/ticket-custom-fields', {
      method: 'POST',
      body: JSON.stringify({ key: 'asset_id', label: 'Asset ID', field_type: 'text' }),
    });

    await updateTicketCustomField(workspaceSlug, 9, { label: 'Asset Number', is_required: true });
    expect(apiRequest).toHaveBeenNthCalledWith(8, '/workspaces/acme/ticket-custom-fields/9', {
      method: 'PATCH',
      body: JSON.stringify({ label: 'Asset Number', is_required: true }),
    });

    await createTicketFormTemplate(workspaceSlug, { name: 'Default Intake', ticket_type_id: null });
    expect(apiRequest).toHaveBeenNthCalledWith(9, '/workspaces/acme/ticket-form-templates', {
      method: 'POST',
      body: JSON.stringify({ name: 'Default Intake', ticket_type_id: null }),
    });

    await updateTicketFormTemplate(workspaceSlug, 10, { name: 'Default Intake v2', ticket_type_id: null });
    expect(apiRequest).toHaveBeenNthCalledWith(10, '/workspaces/acme/ticket-form-templates/10', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Default Intake v2', ticket_type_id: null }),
    });
  });
});
