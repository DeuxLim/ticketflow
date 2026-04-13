import type { RouteObject } from 'react-router-dom';
import { RequireAuth } from '@/components/route-guards';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { WorkspaceDashboardPage } from '../features/workspace/pages/WorkspaceDashboardPage';
import { CustomersPage } from '../features/workspace/pages/CustomersPage';
import { InvitationsPage } from '../features/workspace/pages/InvitationsPage';
import { MembersPage } from '../features/workspace/pages/MembersPage';
import { TicketDetailsPage } from '../features/workspace/pages/TicketDetailsPage';
import { TicketsPage } from '../features/workspace/pages/TicketsPage';
import { WorkspaceSettingsPage } from '../features/workspace/pages/WorkspaceSettingsPage';
import { WorkspaceOnboardingPage } from '../features/workspace/pages/WorkspaceOnboardingPage';

export const workspaceRoutes: RouteObject = {
  path: 'workspaces',
  children: [
    {
      path: 'new',
      element: (
        <RequireAuth>
          <WorkspaceOnboardingPage />
        </RequireAuth>
      ),
    },
    {
      path: ':workspaceSlug',
      element: (
        <RequireAuth>
          <WorkspaceLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <WorkspaceDashboardPage /> },
        { path: 'customers', element: <CustomersPage /> },
        { path: 'tickets', element: <TicketsPage /> },
        { path: 'tickets/:ticketId', element: <TicketDetailsPage /> },
        { path: 'members', element: <MembersPage /> },
        { path: 'invitations', element: <InvitationsPage /> },
        { path: 'settings', element: <WorkspaceSettingsPage /> },
      ],
    },
  ],
};
