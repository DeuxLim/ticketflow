// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { apiRequest } from '@/services/api/client';
import { MembersPage } from './MembersPage';

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
      <MemoryRouter initialEntries={['/workspaces/acme/members']}>
        <Routes>
          <Route path="/workspaces/:workspaceSlug/members" element={ui} />
          <Route path="/workspaces/:workspaceSlug/invitations" element={<p>Invitations opened</p>} />
          <Route path="/workspaces/:workspaceSlug/settings" element={<p>Settings opened</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAccess(permissions = ['members.manage', 'invitations.manage', 'workspace.manage']) {
  vi.mocked(useWorkspaceAccess).mockReturnValue({
    isLoading: false,
    can: (permission: string): boolean => permissions.includes(permission),
  } as unknown as ReturnType<typeof useWorkspaceAccess>);
}

describe('MembersPage', () => {
  let members = [
    {
      id: 1,
      user: {
        id: 10,
        first_name: 'Ava',
        last_name: 'Agent',
        username: 'ava',
        email: 'ava@example.test',
      },
      roles: [{ id: 2, name: 'Agent', slug: 'agent' }],
    },
    {
      id: 2,
      user: {
        id: 99,
        first_name: 'Dana',
        last_name: 'Admin',
        username: 'dana',
        email: 'dana@example.test',
      },
      roles: [{ id: 1, name: 'Admin', slug: 'admin' }],
    },
  ];

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAccess();
    members = [
      {
        id: 1,
        user: {
          id: 10,
          first_name: 'Ava',
          last_name: 'Agent',
          username: 'ava',
          email: 'ava@example.test',
        },
        roles: [{ id: 2, name: 'Agent', slug: 'agent' }],
      },
      {
        id: 2,
        user: {
          id: 99,
          first_name: 'Dana',
          last_name: 'Admin',
          username: 'dana',
          email: 'dana@example.test',
        },
        roles: [{ id: 1, name: 'Admin', slug: 'admin' }],
      },
    ];
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === '/auth/me') {
        return {
          data: {
            id: 99,
            email: 'dana@example.test',
            is_platform_admin: false,
          },
        } as never;
      }

      if (path === '/workspaces/acme/members') {
        return {
          data: members,
        } as never;
      }

      throw new Error(`Unexpected request: ${path}`);
    });
  });

  it('renders member data in the responsive card layout', async () => {
    renderWithProviders(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByRole('article', { name: 'Member Ava Agent' })).not.toBeNull();
    });

    expect(screen.getAllByText('Ava Agent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ava@example.test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Agent').length).toBeGreaterThan(0);
  });

  it('shows the real membership admin entry points and self-protection note', async () => {
    renderWithProviders(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByRole('article', { name: 'Member Ava Agent' })).not.toBeNull();
    });

    expect(screen.getByRole('button', { name: 'Invite Teammates' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Access Settings' })).not.toBeNull();
    expect(screen.getByText('Available Actions')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Actions for member Dana Admin' })).toBeNull();
    expect(screen.getAllByText(/you cannot change your own workspace access from this screen/i).length).toBeGreaterThan(0);
  });

  it('opens the edit role dialog and submits the patch request', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === '/auth/me') {
        return {
          data: {
            id: 99,
            email: 'dana@example.test',
            is_platform_admin: false,
          },
        } as never;
      }

      if (path === '/workspaces/acme/members') {
        return { data: members } as never;
      }

      if (path === '/workspaces/acme/members/role-options') {
        return {
          data: [
            { id: 1, name: 'Admin', slug: 'admin' },
            { id: 2, name: 'Agent', slug: 'agent' },
            { id: 3, name: 'Viewer', slug: 'viewer' },
          ],
        } as never;
      }

      if (path === '/workspaces/acme/members/1' && options?.method === 'PATCH') {
        members = members.map((member) => (
          member.id === 1
            ? { ...member, roles: [{ id: 2, name: 'Agent', slug: 'agent' }] }
            : member
        ));

        return { data: members[0] } as never;
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderWithProviders(<MembersPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Actions for member Ava Agent' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Actions for member Ava Agent' })[0]);
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Edit role' })).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit role' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit role for Ava Agent' })).not.toBeNull();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Role' }).hasAttribute('disabled')).toBe(false);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Role' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/members/1', {
        method: 'PATCH',
        body: JSON.stringify({ role_ids: [2] }),
      });
    });
  });

  it('confirms before removing a member', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === '/auth/me') {
        return {
          data: {
            id: 99,
            email: 'dana@example.test',
            is_platform_admin: false,
          },
        } as never;
      }

      if (path === '/workspaces/acme/members') {
        return { data: members } as never;
      }

      if (path === '/workspaces/acme/members/1' && options?.method === 'DELETE') {
        members = members.filter((member) => member.id !== 1);
        return { message: 'Member removed.' } as never;
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderWithProviders(<MembersPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Actions for member Ava Agent' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Actions for member Ava Agent' })[0]);
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Remove member' })).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove member' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Remove member?' })).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/workspaces/acme/members/1', {
        method: 'DELETE',
      });
    });
  });

  it('shows mutation errors instead of failing silently', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === '/auth/me') {
        return {
          data: {
            id: 99,
            email: 'dana@example.test',
            is_platform_admin: false,
          },
        } as never;
      }

      if (path === '/workspaces/acme/members') {
        return { data: members } as never;
      }

      if (path === '/workspaces/acme/members/1' && options?.method === 'DELETE') {
        throw new Error('The last Admin cannot be removed from the workspace.');
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderWithProviders(<MembersPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Actions for member Ava Agent' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Actions for member Ava Agent' })[0]);
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Remove member' })).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove member' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Remove member?' })).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }));

    await waitFor(() => {
      expect(screen.getByText('Unable to remove member.')).not.toBeNull();
    });
  });
});
