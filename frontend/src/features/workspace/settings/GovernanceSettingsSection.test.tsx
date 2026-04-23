// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GovernanceSettingsSection } from './GovernanceSettingsSection';
import {
  approveBreakGlassRequest,
  createBreakGlassRequest,
  createExport,
  createIdentityProvider,
  createProvisioningDirectory,
  createSlaPolicy,
  deleteIdentityProvider,
  downloadExport,
  getRetentionPolicy,
  getTenantSecurityPolicy,
  listAuditEvents,
  listBreakGlassRequests,
  listExports,
  listIdentityProviders,
  listProvisioningDirectories,
  listSlaPolicies,
  startOidcSso,
  updateRetentionPolicy,
  updateTenantSecurityPolicy,
} from './settings-api';

vi.mock('./settings-api', () => ({
  approveBreakGlassRequest: vi.fn(),
  createBreakGlassRequest: vi.fn(),
  createExport: vi.fn(),
  createIdentityProvider: vi.fn(),
  createProvisioningDirectory: vi.fn(),
  createSlaPolicy: vi.fn(),
  deleteIdentityProvider: vi.fn(),
  downloadExport: vi.fn(),
  getRetentionPolicy: vi.fn(),
  getTenantSecurityPolicy: vi.fn(),
  listAuditEvents: vi.fn(),
  listBreakGlassRequests: vi.fn(),
  listExports: vi.fn(),
  listIdentityProviders: vi.fn(),
  listProvisioningDirectories: vi.fn(),
  listSlaPolicies: vi.fn(),
  startOidcSso: vi.fn(),
  updateRetentionPolicy: vi.fn(),
  updateTenantSecurityPolicy: vi.fn(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

function getEnabledButtonByName(name: string): HTMLButtonElement {
  const button = screen
    .getAllByRole('button', { name })
    .find((item) => !item.hasAttribute('disabled'));

  if (!button) {
    throw new Error(`No enabled button found with name: ${name}`);
  }

  return button as HTMLButtonElement;
}

describe('GovernanceSettingsSection', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getRetentionPolicy).mockResolvedValue({
      data: { tickets_days: 365, comments_days: 365, attachments_days: 365, audit_days: 730 },
    } as never);
    vi.mocked(listExports).mockResolvedValue({ data: [] } as never);
    vi.mocked(listBreakGlassRequests).mockResolvedValue({ data: [] } as never);
    vi.mocked(listSlaPolicies).mockResolvedValue({ data: [] } as never);
    vi.mocked(listAuditEvents).mockResolvedValue({ data: [] } as never);
    vi.mocked(getTenantSecurityPolicy).mockResolvedValue({
      data: {
        id: 1,
        workspace_id: 1,
        require_sso: false,
        require_mfa: false,
        session_ttl_minutes: 720,
        ip_allowlist: [],
        tenant_mode: 'shared',
        dedicated_data_plane_key: null,
        feature_flags: {},
      },
    } as never);
    vi.mocked(listIdentityProviders).mockResolvedValue({ data: [] } as never);
    vi.mocked(listProvisioningDirectories).mockResolvedValue({ data: [] } as never);
    vi.mocked(updateRetentionPolicy).mockResolvedValue({ data: {} } as never);
    vi.mocked(createExport).mockResolvedValue({ data: {} } as never);
    vi.mocked(createBreakGlassRequest).mockResolvedValue({ data: {} } as never);
    vi.mocked(approveBreakGlassRequest).mockResolvedValue({ data: {} } as never);
    vi.mocked(createSlaPolicy).mockResolvedValue({ data: {} } as never);
    vi.mocked(downloadExport).mockResolvedValue(undefined);
    vi.mocked(createIdentityProvider).mockResolvedValue({ data: {} } as never);
    vi.mocked(deleteIdentityProvider).mockResolvedValue({ message: 'ok' } as never);
    vi.mocked(startOidcSso).mockResolvedValue({ data: { authorization_url: 'https://example.test', state: 'state' } } as never);
  });

  it('creates provisioning directory and shows one-time SCIM token', async () => {
    vi.mocked(createProvisioningDirectory).mockResolvedValue({
      data: { id: 10, name: 'Azure AD', status: 'active', workspace_id: 1, created_at: '', updated_at: '' },
      meta: { token: 'scim_abc123' },
    } as never);

    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: 'Create directory' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Directory name'), { target: { value: 'Azure AD' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Create directory' }));

    await waitFor(() => {
      expect(createProvisioningDirectory).toHaveBeenCalledWith('acme', 'Azure AD');
    });

    await waitFor(() => {
      expect(screen.getByText(/Latest SCIM token \(shown once\): scim_abc123/i)).not.toBeNull();
    });
  });

  it('creates an identity provider from a focused dialog', async () => {
    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add provider' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Name'), { target: { value: 'Acme OIDC' } });
    fireEvent.change(dialog.getByLabelText('Issuer'), { target: { value: 'https://idp.example.test' } });
    fireEvent.change(dialog.getByLabelText('Authorization URL'), { target: { value: 'https://idp.example.test/auth' } });
    fireEvent.change(dialog.getByLabelText('Token URL'), { target: { value: 'https://idp.example.test/token' } });
    fireEvent.change(dialog.getByLabelText('Redirect URI'), { target: { value: 'https://app.example.test/callback' } });
    fireEvent.change(dialog.getByLabelText('Client ID'), { target: { value: 'client-id' } });
    fireEvent.change(dialog.getByLabelText('Client secret'), { target: { value: 'client-secret' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Create provider' }));

    await waitFor(() => {
      expect(createIdentityProvider).toHaveBeenCalledWith('acme', expect.objectContaining({
        provider_type: 'oidc',
        name: 'Acme OIDC',
        issuer: 'https://idp.example.test',
        authorization_url: 'https://idp.example.test/auth',
      }));
    });
  });

  it('updates retention policy from a focused dialog', async () => {
    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    expect(screen.queryByLabelText('Tickets (days)')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Edit retention' }));
    const dialog = within(await screen.findByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Tickets (days)'), { target: { value: '400' } });
    fireEvent.change(dialog.getByLabelText('Comments (days)'), { target: { value: '365' } });
    fireEvent.change(dialog.getByLabelText('Attachments (days)'), { target: { value: '180' } });
    fireEvent.change(dialog.getByLabelText('Audit (days)'), { target: { value: '900' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Save retention policy' }));

    await waitFor(() => {
      expect(updateRetentionPolicy).toHaveBeenCalledWith('acme', {
        tickets_days: 400,
        comments_days: 365,
        attachments_days: 180,
        audit_days: 900,
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('shows security policy save error message on failure', async () => {
    vi.mocked(updateTenantSecurityPolicy).mockRejectedValue(new Error('Security policy save failed.'));

    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    expect(screen.queryByLabelText('Session TTL (minutes)')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Edit policy' }));
    const dialog = within(await screen.findByRole('dialog'));
    fireEvent.click(dialog.getByRole('button', { name: 'Save security policy' }));

    await waitFor(() => {
      expect(screen.getByText('Security policy save failed.')).not.toBeNull();
    });
  });

  it('calls break-glass approve and export download actions', async () => {
    vi.mocked(listExports).mockResolvedValue({
      data: [{ id: 5, status: 'completed', download_token: 'tok-123', created_at: '2026-04-17T00:00:00Z' }],
    } as never);
    vi.mocked(listBreakGlassRequests).mockResolvedValue({
      data: [{ id: 8, status: 'pending', created_at: '2026-04-17T00:00:00Z' }],
    } as never);

    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Download' }).length).toBeGreaterThan(0);
    });
    fireEvent.click(getEnabledButtonByName('Download'));
    await waitFor(() => {
      expect(downloadExport).toHaveBeenCalledWith('acme', 5, 'tok-123');
    });

    fireEvent.click(getEnabledButtonByName('Approve'));
    await waitFor(() => {
      expect(approveBreakGlassRequest).toHaveBeenCalledWith('acme', 8);
    });
  });

  it('requests break-glass access from a focused dialog', async () => {
    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: 'Request access' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Reason'), { target: { value: 'Investigating Sev1 outage.' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Request access' }));

    await waitFor(() => {
      expect(createBreakGlassRequest).toHaveBeenCalledWith('acme', 'Investigating Sev1 outage.', 60);
    });
  });

  it('creates an SLA policy', async () => {
    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: 'Create SLA policy' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Policy name'), { target: { value: 'P1 SLA' } });
    fireEvent.change(dialog.getByLabelText('First response (minutes)'), { target: { value: '20' } });
    fireEvent.change(dialog.getByLabelText('Resolution (minutes)'), { target: { value: '180' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Create SLA policy' }));

    await waitFor(() => {
      expect(createSlaPolicy).toHaveBeenCalledWith('acme', {
        name: 'P1 SLA',
        priority: 'high',
        first_response_minutes: 20,
        resolution_minutes: 180,
        is_active: true,
      });
    });
  });
});
