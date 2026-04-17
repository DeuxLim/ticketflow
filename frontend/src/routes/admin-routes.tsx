/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RequirePlatformAdmin } from '@/components/route-guards';

const AdminLayout = lazy(() => import('../layouts/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: (
    <RequirePlatformAdmin>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <AdminLayout />
      </Suspense>
    </RequirePlatformAdmin>
  ),
  children: [{
    index: true,
    element: (
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <AdminDashboardPage />
      </Suspense>
    ),
  }],
};
