import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { authRoutes } from '../routes/auth-routes';
import { workspaceRoutes } from '../routes/workspace-routes';
import { adminRoutes } from '../routes/admin-routes';

const LandingPage = lazy(() => import('../features/marketing/pages/LandingPage').then((module) => ({ default: module.LandingPage })));

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <LandingPage />
      </Suspense>
    ),
  },
  authRoutes,
  workspaceRoutes,
  adminRoutes,
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
