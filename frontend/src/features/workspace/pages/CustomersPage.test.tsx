// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest } from '@/services/api/client';
import { CustomersPage } from './CustomersPage';

vi.mock('@/hooks/use-workspace-access', () => ({
  useWorkspaceAccess: vi.fn(),
}));

vi.mock('@/services/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/services/api/client')>('@/services/api/client');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workspaces/acme/customers']}>
        <Routes>
          <Route path="/workspaces/:workspaceSlug/customers" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAccess() {
  vi.mocked(useWorkspaceAccess).mockReturnValue({
    isLoading: false,
    can: (permission: string) => ['customers.view', 'customers.manage'].includes(permission),
  } as ReturnType<typeof useWorkspaceAccess>);
}

describe('CustomersPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAccess();
    vi.mocked(apiRequest).mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === '/workspaces/acme/customers' && options?.method === 'POST') {
        return { data: {} } as never;
      }

      if (path === '/workspaces/acme/customers') {
        return {
          data: [
            {
              id: 1,
              workspace_id: 1,
              name: 'Jane Doe',
              email: 'jane@example.test',
              phone: '+639171234567',
              company: 'Acme Corp',
              job_title: 'Operations Lead',
              website: 'https://acme.example',
              timezone: 'Asia/Manila',
              preferred_contact_method: 'email',
              preferred_language: 'English',
              address: '123 Support Street',
              external_reference: 'CRM-1001',
              support_tier: 'enterprise',
              status: 'active',
              internal_notes: 'Escalate renewal questions.',
              updated_at: '2026-04-28T00:00:00Z',
            },
          ],
        } as never;
      }

      throw new Error(`Unexpected request: ${path}`);
    });
  });

  it('surfaces enriched customer profile fields in the directory and detail dialog', async () => {
    renderWithProviders(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Operations Lead')).not.toBeNull();
    expect(screen.getByText('CRM-1001')).not.toBeNull();
    expect(screen.getAllByText('enterprise').length).toBeGreaterThan(0);
    expect(screen.getAllByText('active').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Actions for Jane Doe' })[0]);
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'View' })).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'View' }));

    await waitFor(() => {
      expect(screen.getByText('Internal notes')).not.toBeNull();
      expect(screen.getByText('Escalate renewal questions.')).not.toBeNull();
      expect(screen.getByText('123 Support Street')).not.toBeNull();
    });
  });

  it('sends enriched customer fields when creating a profile', async () => {
    renderWithProviders(<CustomersPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Customer' }));

    fireEvent.change(screen.getByLabelText('Customer name'), { target: { value: 'New Customer' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.test' } });
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'IT Manager' } });
    fireEvent.change(screen.getByLabelText('Website'), { target: { value: 'https://new.example' } });
    fireEvent.change(screen.getByLabelText('External reference'), { target: { value: 'CRM-2002' } });
    fireEvent.change(screen.getByLabelText('Internal notes'), { target: { value: 'VIP onboarding.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Customer' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/customers', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"job_title":"IT Manager"'),
      }));
    });

    const createCall = vi.mocked(apiRequest).mock.calls.find(([path, options]) => path === '/workspaces/acme/customers' && options?.method === 'POST');
    expect(createCall).toBeDefined();
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual(expect.objectContaining({
      email: 'new@example.test',
      external_reference: 'CRM-2002',
      internal_notes: 'VIP onboarding.',
      job_title: 'IT Manager',
      website: 'https://new.example',
    }));
  });
});
