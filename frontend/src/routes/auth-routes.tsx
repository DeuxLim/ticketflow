/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const AuthLayout = lazy(() => import('../layouts/AuthLayout').then((module) => ({ default: module.AuthLayout })));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })));

export const authRoutes: RouteObject = {
  path: 'auth',
  element: (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <AuthLayout />
    </Suspense>
  ),
  children: [
    {
      path: 'login',
      element: (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
          <LoginPage />
        </Suspense>
      ),
    },
  ],
};
