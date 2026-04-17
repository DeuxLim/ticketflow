/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RequireAuth } from '@/components/route-guards';

const WorkspaceLayout = lazy(() => import('../layouts/WorkspaceLayout').then((module) => ({ default: module.WorkspaceLayout })));
const WorkspaceDashboardPage = lazy(() => import('../features/workspace/pages/WorkspaceDashboardPage').then((module) => ({ default: module.WorkspaceDashboardPage })));
const CustomersPage = lazy(() => import('../features/workspace/pages/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const InvitationsPage = lazy(() => import('../features/workspace/pages/InvitationsPage').then((module) => ({ default: module.InvitationsPage })));
const MembersPage = lazy(() => import('../features/workspace/pages/MembersPage').then((module) => ({ default: module.MembersPage })));
const TicketDetailsPage = lazy(() => import('../features/workspace/pages/TicketDetailsPage').then((module) => ({ default: module.TicketDetailsPage })));
const TicketsPage = lazy(() => import('../features/workspace/pages/TicketsPage').then((module) => ({ default: module.TicketsPage })));
const WorkspaceSettingsPage = lazy(() => import('../features/workspace/pages/WorkspaceSettingsPage').then((module) => ({ default: module.WorkspaceSettingsPage })));
const WorkspaceOnboardingPage = lazy(() => import('../features/workspace/pages/WorkspaceOnboardingPage').then((module) => ({ default: module.WorkspaceOnboardingPage })));

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>{element}</Suspense>;
}

export const workspaceRoutes: RouteObject = {
  path: 'workspaces',
  children: [
    {
      path: 'new',
      element: (
        <RequireAuth>
          {withSuspense(<WorkspaceOnboardingPage />)}
        </RequireAuth>
      ),
    },
    {
      path: ':workspaceSlug',
      element: (
        <RequireAuth>
          {withSuspense(<WorkspaceLayout />)}
        </RequireAuth>
      ),
      children: [
        { index: true, element: withSuspense(<WorkspaceDashboardPage />) },
        { path: 'customers', element: withSuspense(<CustomersPage />) },
        { path: 'tickets', element: withSuspense(<TicketsPage />) },
        { path: 'tickets/:ticketId', element: withSuspense(<TicketDetailsPage />) },
        { path: 'members', element: withSuspense(<MembersPage />) },
        { path: 'invitations', element: withSuspense(<InvitationsPage />) },
        { path: 'settings', element: withSuspense(<WorkspaceSettingsPage />) },
      ],
    },
  ],
};
