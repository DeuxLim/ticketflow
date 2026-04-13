import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LandingPage } from '../features/marketing/pages/LandingPage';
import { authRoutes } from '../routes/auth-routes';
import { workspaceRoutes } from '../routes/workspace-routes';
import { adminRoutes } from '../routes/admin-routes';

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  authRoutes,
  workspaceRoutes,
  adminRoutes,
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
