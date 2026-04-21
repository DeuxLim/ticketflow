// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TicketingSettingsSection } from './TicketingSettingsSection';
import {
  createTicketCategory,
  createTicketTag,
  createTicketType,
  getTicketingSettings,
  listTicketCategories,
  listTicketTags,
  listTicketTypes,
  updateTicketCategory,
  updateTicketTag,
  updateTicketType,
  updateTicketingSettings,
} from './settings-api';

vi.mock('./settings-api', () => ({
  createTicketCategory: vi.fn(),
  createTicketTag: vi.fn(),
  createTicketType: vi.fn(),
  getTicketingSettings: vi.fn(),
  listTicketCategories: vi.fn(),
  listTicketTags: vi.fn(),
  listTicketTypes: vi.fn(),
  updateTicketCategory: vi.fn(),
  updateTicketTag: vi.fn(),
  updateTicketType: vi.fn(),
  updateTicketingSettings: vi.fn(),
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

describe('TicketingSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTicketingSettings).mockResolvedValue({ data: { ticket_number_format: 'TKT-{seq:6}', assignment_strategy: 'manual' } } as never);
    vi.mocked(listTicketCategories).mockResolvedValue({ data: [{ id: 1, key: 'billing', name: 'Billing', is_active: true }] } as never);
    vi.mocked(listTicketTypes).mockResolvedValue({ data: [{ id: 2, key: 'incident', name: 'Incident', is_active: true }] } as never);
    vi.mocked(listTicketTags).mockResolvedValue({ data: [{ id: 3, name: 'vip', is_active: true }] } as never);
    vi.mocked(createTicketCategory).mockResolvedValue({ data: {} } as never);
    vi.mocked(createTicketType).mockResolvedValue({ data: {} } as never);
    vi.mocked(createTicketTag).mockResolvedValue({ data: {} } as never);
    vi.mocked(updateTicketingSettings).mockResolvedValue({ data: {} } as never);
    vi.mocked(updateTicketCategory).mockResolvedValue({ data: {} } as never);
    vi.mocked(updateTicketType).mockResolvedValue({ data: {} } as never);
    vi.mocked(updateTicketTag).mockResolvedValue({ data: {} } as never);
  });

  it('creates a category from quick-create form', async () => {
    renderWithQueryClient(<TicketingSettingsSection workspaceSlug="acme" />);

    await waitFor(() => {
      expect(screen.getByText('Config dictionaries')).not.toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Manage categories' }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Category name')).not.toBeNull();
    });

    fireEvent.change(screen.getByPlaceholderText('Category name'), { target: { value: 'Finance Billing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(createTicketCategory).toHaveBeenCalledWith('acme', expect.objectContaining({
        name: 'Finance Billing',
        key: 'finance-billing',
      }));
    });
  });
});
