// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GovernanceSettingsSection } from './GovernanceSettingsSection';
import {
  createExport,
  createSlaPolicy,
  downloadExport,
  getRetentionPolicy,
  getTenantSecurityPolicy,
  listAuditEvents,
  listExports,
  listSlaPolicies,
  updateRetentionPolicy,
  updateTenantSecurityPolicy,
} from '@/features/workspace/api/settings-api';

vi.mock('@/features/workspace/api/settings-api', () => ({
  createExport: vi.fn(),
  createSlaPolicy: vi.fn(),
  downloadExport: vi.fn(),
  getRetentionPolicy: vi.fn(),
  getTenantSecurityPolicy: vi.fn(),
  listAuditEvents: vi.fn(),
  listExports: vi.fn(),
  listSlaPolicies: vi.fn(),
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
    vi.mocked(listSlaPolicies).mockResolvedValue({ data: [] } as never);
    vi.mocked(listAuditEvents).mockResolvedValue({ data: [] } as never);
    vi.mocked(getTenantSecurityPolicy).mockResolvedValue({
      data: {
        id: 1,
        workspace_id: 1,
        require_mfa: false,
        session_ttl_minutes: 720,
        ip_allowlist: [],
        tenant_mode: 'shared',
        dedicated_data_plane_key: null,
        feature_flags: {},
      },
    } as never);
    vi.mocked(updateRetentionPolicy).mockResolvedValue({ data: {} } as never);
    vi.mocked(createExport).mockResolvedValue({ data: {} } as never);
    vi.mocked(createSlaPolicy).mockResolvedValue({ data: {} } as never);
    vi.mocked(downloadExport).mockResolvedValue(undefined);
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

  it('calls export download actions', async () => {
    vi.mocked(listExports).mockResolvedValue({
      data: [{ id: 5, status: 'completed', download_token: 'tok-123', created_at: '2026-04-17T00:00:00Z' }],
    } as never);

    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Download' }).length).toBeGreaterThan(0);
    });
    fireEvent.click(getEnabledButtonByName('Download'));
    await waitFor(() => {
      expect(downloadExport).toHaveBeenCalledWith('acme', 5, 'tok-123');
    });
  });

  it('creates a ticket timing target', async () => {
    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add target' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Target name'), { target: { value: 'High priority target' } });
    fireEvent.change(dialog.getByLabelText('First reply target (minutes)'), { target: { value: '20' } });
    fireEvent.change(dialog.getByLabelText('Resolution target (minutes)'), { target: { value: '180' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Add target' }));

    await waitFor(() => {
      expect(createSlaPolicy).toHaveBeenCalledWith('acme', {
        name: 'High priority target',
        priority: 'high',
        first_response_minutes: 20,
        resolution_minutes: 180,
        is_active: true,
      });
    });
  });
});
