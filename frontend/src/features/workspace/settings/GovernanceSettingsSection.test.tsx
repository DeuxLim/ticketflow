// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GovernanceSettingsSection } from './GovernanceSettingsSection';
import {
  createSlaPolicy,
  getTenantSecurityPolicy,
  listAuditEvents,
  listSlaPolicies,
  updateTenantSecurityPolicy,
} from '@/features/workspace/api/settings-api';

vi.mock('@/features/workspace/api/settings-api', () => ({
  createSlaPolicy: vi.fn(),
  getTenantSecurityPolicy: vi.fn(),
  listAuditEvents: vi.fn(),
  listSlaPolicies: vi.fn(),
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

describe('GovernanceSettingsSection', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();

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
    vi.mocked(createSlaPolicy).mockResolvedValue({ data: {} } as never);
  });

  it('hides deferred retention controls from governance settings', async () => {
    renderWithQueryClient(<GovernanceSettingsSection workspaceSlug="acme" />);

    expect(screen.queryByLabelText('Tickets (days)')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit retention' })).toBeNull();
    expect(screen.queryByText('Retention policy')).toBeNull();
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
