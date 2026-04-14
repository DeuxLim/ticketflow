// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationsSettingsSection } from './IntegrationsSettingsSection';
import {
  createWebhookEndpoint,
  listWebhookDeliveries,
  listWebhookEndpoints,
  retryWebhookDelivery,
} from './settings-api';

vi.mock('./settings-api', () => ({
  createWebhookEndpoint: vi.fn(),
  listWebhookDeliveries: vi.fn(),
  listWebhookEndpoints: vi.fn(),
  retryWebhookDelivery: vi.fn(),
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

describe('IntegrationsSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listWebhookEndpoints).mockResolvedValue({ data: [] } as never);
    vi.mocked(listWebhookDeliveries).mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } } as never);
    vi.mocked(retryWebhookDelivery).mockResolvedValue({ data: { id: 1 } } as never);
  });

  it('creates endpoint and clears form on success', async () => {
    vi.mocked(createWebhookEndpoint).mockResolvedValue({ data: { id: 1 } } as never);
    renderWithQueryClient(<IntegrationsSettingsSection workspaceSlug="acme" />);

    fireEvent.change(screen.getByLabelText('Endpoint name'), { target: { value: 'Primary Hook' } });
    fireEvent.change(screen.getByLabelText('Webhook URL'), { target: { value: 'https://example.test/webhooks' } });
    fireEvent.change(screen.getByLabelText('Signing secret'), { target: { value: 'very-secret-123' } });
    fireEvent.click(getEnabledButtonByName('Create endpoint'));

    await waitFor(() => {
      expect(createWebhookEndpoint).toHaveBeenCalledWith('acme', expect.objectContaining({
        name: 'Primary Hook',
        url: 'https://example.test/webhooks',
        secret: 'very-secret-123',
      }));
    });

    await waitFor(() => {
      expect((screen.getByLabelText('Endpoint name') as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText('Webhook URL') as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText('Signing secret') as HTMLInputElement).value).toBe('');
    });
  });

  it('shows create error message when endpoint creation fails', async () => {
    vi.mocked(createWebhookEndpoint).mockRejectedValue(new Error('Unable to create endpoint.'));
    renderWithQueryClient(<IntegrationsSettingsSection workspaceSlug="acme" />);

    fireEvent.change(screen.getByLabelText('Endpoint name'), { target: { value: 'Primary Hook' } });
    fireEvent.change(screen.getByLabelText('Webhook URL'), { target: { value: 'https://example.test/webhooks' } });
    fireEvent.change(screen.getByLabelText('Signing secret'), { target: { value: 'very-secret-123' } });
    fireEvent.click(getEnabledButtonByName('Create endpoint'));

    await waitFor(() => {
      expect(screen.getByText('Unable to create endpoint.')).not.toBeNull();
    });
  });

  it('retries a failed delivery', async () => {
    vi.mocked(listWebhookDeliveries).mockResolvedValue({
      data: [
        {
          id: 12,
          webhook_endpoint_id: 1,
          integration_event_id: 2,
          attempt_count: 1,
          status: 'failed',
          response_status: 500,
          response_body: 'error',
          next_attempt_at: null,
          delivered_at: null,
          created_at: '2026-04-14T00:00:00Z',
          updated_at: '2026-04-14T00:00:00Z',
          endpoint: { id: 1, name: 'Primary Hook', url: 'https://example.test/webhooks' },
          event: { id: 2, event_type: 'ticket.created', occurred_at: '2026-04-14T00:00:00Z' },
        },
      ],
      meta: { current_page: 1, last_page: 1, total: 1 },
    } as never);
    renderWithQueryClient(<IntegrationsSettingsSection workspaceSlug="acme" />);

    await waitFor(() => {
      expect(screen.getByText('Primary Hook - ticket.created')).not.toBeNull();
    });
    fireEvent.click(getEnabledButtonByName('Retry'));

    await waitFor(() => {
      expect(retryWebhookDelivery).toHaveBeenCalledWith('acme', 12);
    });
  });

  it('shows retry error when delivery retry fails', async () => {
    vi.mocked(listWebhookDeliveries).mockResolvedValue({
      data: [
        {
          id: 12,
          webhook_endpoint_id: 1,
          integration_event_id: 2,
          attempt_count: 1,
          status: 'failed',
          response_status: 500,
          response_body: 'error',
          next_attempt_at: null,
          delivered_at: null,
          created_at: '2026-04-14T00:00:00Z',
          updated_at: '2026-04-14T00:00:00Z',
          endpoint: { id: 1, name: 'Primary Hook', url: 'https://example.test/webhooks' },
          event: { id: 2, event_type: 'ticket.created', occurred_at: '2026-04-14T00:00:00Z' },
        },
      ],
      meta: { current_page: 1, last_page: 1, total: 1 },
    } as never);
    vi.mocked(retryWebhookDelivery).mockRejectedValue(new Error('Retry failed.'));
    renderWithQueryClient(<IntegrationsSettingsSection workspaceSlug="acme" />);

    await waitFor(() => {
      expect(screen.getByText('Primary Hook - ticket.created')).not.toBeNull();
    });
    fireEvent.click(getEnabledButtonByName('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Retry failed.')).not.toBeNull();
    });
  });
});
