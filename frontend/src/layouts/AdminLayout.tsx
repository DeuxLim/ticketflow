import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { clearAuthToken } from '@/lib/auth-session';
import { apiRequest } from '@/services/api/client';

export function AdminLayout() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await apiRequest<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Local token cleanup still signs the user out even if the API call fails.
    } finally {
      clearAuthToken();
      navigate('/auth/login', { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Platform admin</p>
            <p className="text-xs text-muted-foreground">Global system controls</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Owner only</Badge>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
