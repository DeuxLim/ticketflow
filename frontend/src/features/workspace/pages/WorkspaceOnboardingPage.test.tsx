// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceOnboardingPage } from './WorkspaceOnboardingPage';
import { createWorkspace, listUserWorkspaces } from './workspaceOnboardingApi';

vi.mock('./workspaceOnboardingApi', () => ({
  createWorkspace: vi.fn(),
  listUserWorkspaces: vi.fn(),
}));

vi.mock('@/lib/workspace-session', () => ({
  getLastWorkspaceSlug: vi.fn(() => null),
  setLastWorkspaceSlug: vi.fn(),
}));

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workspaces/new']}>
        <Routes>
          <Route path="/workspaces/new" element={ui} />
          <Route path="/workspaces/:workspaceSlug" element={<p>Workspace opened</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('WorkspaceOnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listUserWorkspaces).mockResolvedValue({ data: [] });
    vi.mocked(createWorkspace).mockResolvedValue({ data: { id: 1, name: 'Acme Support', slug: 'acme-support' } } as never);
  });

  afterEach(() => {
    cleanup();
  });

  it('explains workspace fields and creates the first workspace', async () => {
    renderWithProviders(<WorkspaceOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Create your first workspace')).not.toBeNull();
    });

    expect(screen.getByText(/human-friendly name/i)).not.toBeNull();
    expect(screen.getByText(/used in the workspace url/i)).not.toBeNull();

    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Acme Support' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Workspace URL slug')).toHaveProperty('value', 'acme-support');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create workspace' }));

    await waitFor(() => {
      expect(createWorkspace).toHaveBeenCalledWith({ name: 'Acme Support', slug: 'acme-support' });
    });

    await waitFor(() => {
      expect(screen.getByText('Workspace opened')).not.toBeNull();
    });
  });
});
