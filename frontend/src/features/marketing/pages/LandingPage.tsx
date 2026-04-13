import { ArrowRight, CheckCircle2, ShieldCheck, Workflow } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const featureRows = [
  ['Workspace isolation', 'Every customer, ticket, and role stays scoped to the active workspace.'],
  ['Clear queues', 'Teams can scan priority, ownership, and status without extra chrome.'],
  ['Enterprise controls', 'Security, automation, and workflow settings stay close to the work.'],
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg border bg-card">
              <ShieldCheck className="size-4" />
            </div>
            <span className="text-sm font-semibold">Ticketing Cloud</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#workspace">Workspace</a>
            <a className="transition-colors hover:text-foreground" href="#controls">Controls</a>
            <a className="transition-colors hover:text-foreground" href="#security">Security</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link className={buttonVariants({ variant: 'ghost', size: 'sm' })} to="/auth/login">
              Log in
            </Link>
            <Link className={buttonVariants({ size: 'sm' })} to="/auth/login">
              Open Workspace
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b">
          <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="rounded-full">
                Multi-tenant support
              </Badge>
              <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
                Support operations, quietly organized.
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
                A calm workspace for tickets, customers, permissions, and tenant controls.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link className={buttonVariants({ size: 'lg' })} to="/auth/login">
                  Start working
                  <ArrowRight data-icon="inline-end" />
                </Link>
                <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} to="/admin">
                  Platform admin
                </Link>
              </div>
            </div>

            <div className="relative" id="workspace">
              <Card className="mx-auto w-full max-w-3xl bg-card/90 shadow-none">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>Northwind Support</CardTitle>
                      <CardDescription>Workspace queue</CardDescription>
                    </div>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-[220px_1fr]">
                    <div className="flex flex-col gap-4 border-b p-5 md:border-b-0 md:border-r">
                      <Metric label="Open" value="18" />
                      <Metric label="In progress" value="9" />
                      <Metric label="Resolved" value="44" />
                    </div>
                    <div className="divide-y">
                      <TicketPreview title="Invoice PDF fails for enterprise customer" meta="High priority · A. Cruz" />
                      <TicketPreview title="Workspace invitation link expired" meta="Medium priority · M. Reyes" />
                      <TicketPreview title="Internal comment access review" meta="Low priority · J. Tan" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr]" id="controls">
          <div>
            <Badge variant="outline">Controls</Badge>
            <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              Everything has a place.
            </h2>
          </div>
          <div className="divide-y border-y">
            {featureRows.map(([title, text]) => (
              <div className="grid gap-3 py-6 md:grid-cols-[220px_1fr]" key={title}>
                <p className="font-medium">{title}</p>
                <p className="text-pretty text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-card/60" id="security">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
            <Proof icon={<ShieldCheck />} title="Tenant-safe" text="Workspace boundaries stay explicit." />
            <Proof icon={<Workflow />} title="Workflow-aware" text="Queues, forms, and automation live together." />
            <Proof icon={<CheckCircle2 />} title="Operator-first" text="The next action stays visible." />
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function TicketPreview({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
      </div>
      <Badge variant="outline">Open</Badge>
    </div>
  );
}

function Proof({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground">
        {icon}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
      <Separator className="mt-2 md:hidden" />
    </div>
  );
}
