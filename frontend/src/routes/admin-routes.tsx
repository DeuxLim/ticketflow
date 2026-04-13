import type { RouteObject } from 'react-router-dom';
import { RequirePlatformAdmin } from '@/components/route-guards';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: (
    <RequirePlatformAdmin>
      <AdminLayout />
    </RequirePlatformAdmin>
  ),
  children: [{ index: true, element: <AdminDashboardPage /> }],
};
