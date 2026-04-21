// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormsSettingsSection } from './FormsSettingsSection';
import {
  createTicketCustomField,
  createTicketFormTemplate,
  listTicketCustomFields,
  listTicketFormTemplates,
  listTicketTypes,
  updateTicketCustomField,
  updateTicketFormTemplate,
} from './settings-api';

vi.mock('./settings-api', () => ({
  createTicketCustomField: vi.fn(),
  createTicketFormTemplate: vi.fn(),
  listTicketCustomFields: vi.fn(),
  listTicketFormTemplates: vi.fn(),
  listTicketTypes: vi.fn(),
  updateTicketCustomField: vi.fn(),
  updateTicketFormTemplate: vi.fn(),
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

describe('FormsSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listTicketCustomFields).mockResolvedValue({ data: [] } as never);
    vi.mocked(listTicketFormTemplates).mockResolvedValue({ data: [] } as never);
    vi.mocked(listTicketTypes).mockResolvedValue({ data: [{ id: 1, name: 'Incident' }] } as never);
    vi.mocked(createTicketCustomField).mockResolvedValue({ data: {} } as never);
    vi.mocked(createTicketFormTemplate).mockResolvedValue({ data: {} } as never);
    vi.mocked(updateTicketCustomField).mockResolvedValue({ data: {} } as never);
    vi.mocked(updateTicketFormTemplate).mockResolvedValue({ data: {} } as never);
  });

  it('creates template with nullable ticket type when Any type is selected', async () => {
    renderWithQueryClient(<FormsSettingsSection workspaceSlug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: 'Manage templates' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).not.toBeNull();
    });

    fireEvent.change(screen.getByLabelText('Template name'), { target: { value: 'Default Intake' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add template' }));

    await waitFor(() => {
      expect(createTicketFormTemplate).toHaveBeenCalledWith('acme', expect.objectContaining({
        name: 'Default Intake',
        ticket_type_id: null,
      }));
    });
  });
});
