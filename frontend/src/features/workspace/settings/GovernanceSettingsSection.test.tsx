// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GovernanceSettingsSection } from './GovernanceSettingsSection';
import {
  createBreakGlassRequest,
  createExport,
  createIdentityProvider,
  createProvisioningDirectory,
  deleteIdentityProvider,
  getRetentionPolicy,
  getTenantSecurityPolicy,
  listAuditEvents,
  listBreakGlassRequests,
  listExports,
  listIdentityProviders,
  listProvisioningDirectories,
  startOidcSso,
  updateRetentionPolicy,
  updateTenantSecurityPolicy,
} from './settings-api';

vi.mock('./settings-api', () => ({
  createBreakGlassRequest: vi.fn(),
  createExport: vi.fn(),
  createIdentityProvider: vi.fn(),
  createProvisioningDirectory: vi.fn(),
  deleteIdentityProvider: vi.fn(),
  getRetentionPolicy: vi.fn(),
  getTenantSecurityPolicy: vi.fn(),
  listAuditEvents: vi.fn(),
  listBreakGlassRequests: vi.fn(),
  listExports: vi.fn(),
  listIdentityProviders: vi.fn(),
  listProvisioningDirectories: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getRetentionPolicy).mockResolvedValue({
      data: { tickets_days: 365, comments_days: 365, attachments_days: 365, audit_days: 730 },
    } as never);
    vi.mocked(listExports).mockResolvedValue({ data: [] } as never);
    vi.mocked(listBreakGlassRequests).mockResolvedValue({ data: [] } as never);
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

    fireEvent.change(screen.getByPlaceholderText('Directory name'), { target: { value: 'Azure AD' } });
    fireEvent.click(getEnabledButtonByName('Create directory'));

    await waitFor(() => {
      expect(createProvisioningDirectory).toHaveBeenCalledWith('acme', 'Azure AD');
    });

    await waitFor(() => {
      expect(screen.getByText(/Latest SCIM token \(shown once\): scim_abc123/i)).not.toBeNull();
    });
  });

  it('shows security policy save error message on failure', async () => {
    vi.mocked(updateTenantSecurityPolicy).mockRejectedValue(new Error('Security policy save failed.'));

    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    fireEvent.click(getEnabledButtonByName('Save security policy'));

    await waitFor(() => {
      expect(screen.getByText('Security policy save failed.')).not.toBeNull();
    });
  });
});
