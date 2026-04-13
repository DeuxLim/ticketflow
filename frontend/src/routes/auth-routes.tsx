import type { RouteObject } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';

export const authRoutes: RouteObject = {
  path: 'auth',
  element: <AuthLayout />,
  children: [
    { path: 'login', element: <LoginPage /> },
  ],
};
