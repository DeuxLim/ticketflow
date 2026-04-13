import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Navigate, useLocation, type To } from 'react-router-dom';
import { getAuthToken } from '@/lib/auth-session';
import { apiRequest } from '@/services/api/client';
import type { ApiEnvelope } from '@/types/api';

type GuardProps = {
  children: ReactNode;
};

type AuthUser = {
  id: number;
  email: string;
  is_platform_admin: boolean;
};

function RedirectToLogin({ from }: { from: To }) {
  return <Navigate to="/auth/login" replace state={{ from }} />;
}

export function RequireAuth({ children }: GuardProps) {
  const location = useLocation();
  const token = getAuthToken();

  if (!token) {
    return <RedirectToLogin from={location} />;
  }

  return <>{children}</>;
}

export function RequirePlatformAdmin({ children }: GuardProps) {
  const location = useLocation();
  const token = getAuthToken();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<ApiEnvelope<AuthUser>>('/auth/me'),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  if (!token) {
    return <RedirectToLogin from={location} />;
  }

  if (meQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Verifying access...</p>;
  }

  if (meQuery.isError || !meQuery.data?.data) {
    return <RedirectToLogin from={location} />;
  }

  if (!meQuery.data.data.is_platform_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
