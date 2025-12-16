import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function AuthLayout() {
  const showDemoCredentials = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <section className="max-w-xl">
          <Badge variant="secondary" className="rounded-full">
            Ticketing Cloud
          </Badge>
          <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-6xl">
            Sign in to a quieter support workspace.
          </h1>
          <p className="mt-4 max-w-md text-pretty text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Tickets, customers, roles, and workspace settings stay organized in one clean surface.
          </p>
          <Separator className="my-6 max-w-sm sm:my-8" />
          <Card className="max-w-md bg-card/70 shadow-none">
            <CardContent className="flex flex-col gap-5 p-4 sm:p-5">
              {showDemoCredentials ? (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Local demo accounts</p>
                    <p className="text-sm text-muted-foreground">Use a seeded account to explore the app in development.</p>
                  </div>
                  <div className="grid gap-2 rounded-lg border border-border/70 p-3 text-sm">
                    <Credential label="Workspace user" email="user@ticketing.local" password="User@12345" />
                    <Credential label="Platform admin" email="admin@ticketing.local" password="Admin@12345" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Workspace access</p>
                  <p className="text-sm text-muted-foreground">Sign in with the account your workspace admin provided.</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Stat label="Customers" value="1" />
                <Stat label="Tickets" value="1" />
                <Stat label="SLA" value="On track" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto w-full max-w-md">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Credential({ label, email, password }: { label: string; email: string; password: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-mono text-xs">{email}</p>
      <p className="font-mono text-xs">{password}</p>
    </div>
  );
}
