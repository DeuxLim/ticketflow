import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="max-w-xl">
          <Badge variant="secondary" className="rounded-full">
            Ticketing Cloud
          </Badge>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Sign in to a quieter support workspace.
          </h1>
          <p className="mt-5 max-w-md text-pretty text-base leading-7 text-muted-foreground">
            Tickets, customers, roles, and workspace settings stay organized in one clean surface.
          </p>
          <Separator className="my-8 max-w-sm" />
          <Card className="max-w-md bg-card/70 shadow-none">
            <CardContent className="grid gap-5 p-5">
              <div>
                <p className="text-sm font-medium">Demo workspace</p>
                <p className="mt-1 text-sm text-muted-foreground">Use the seeded account to explore the app locally.</p>
              </div>
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
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
