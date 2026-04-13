import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { clearAuthToken } from '@/lib/auth-session';
import { setLastWorkspaceSlug } from '@/lib/workspace-session';
import { apiRequest } from '@/services/api/client';
import type { ApiEnvelope, Workspace } from '@/types/api';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Building2, LayoutDashboard, Mail, Settings, Ticket, Users } from 'lucide-react';

const links = [
  { to: '.', label: 'Overview', icon: LayoutDashboard, permission: null, permissionsAny: null },
  { to: 'customers', label: 'Customers', icon: Users, permission: 'customers.view', permissionsAny: null },
  { to: 'tickets', label: 'Tickets', icon: Ticket, permission: 'tickets.view', permissionsAny: null },
  { to: 'members', label: 'Members', icon: Users, permission: 'members.manage', permissionsAny: null },
  { to: 'invitations', label: 'Invitations', icon: Mail, permission: 'invitations.manage', permissionsAny: null },
  {
    to: 'settings',
    label: 'Settings',
    icon: Settings,
    permission: null,
    permissionsAny: ['workspace.manage', 'tickets.manage', 'security.manage', 'integrations.manage', 'automation.manage'],
  },
];

export function WorkspaceLayout() {
  const { workspaceSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const workspacesQuery = useQuery({
    queryKey: ['workspaces', 'switcher'],
    queryFn: () => apiRequest<ApiEnvelope<Workspace[]>>('/workspaces'),
  });

  const workspaces = workspacesQuery.data?.data ?? [];
  const activeWorkspace = workspaces.find((workspace) => workspace.slug === workspaceSlug);
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const visibleLinks = links.filter((link) => {
    if (link.permission) return accessQuery.can(link.permission);
    if (link.permissionsAny) return link.permissionsAny.some((permission) => accessQuery.can(permission));
    return true;
  });

  useEffect(() => {
    if (workspaceSlug) {
      setLastWorkspaceSlug(workspaceSlug);
    }
  }, [workspaceSlug]);

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
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" variant="inset" className="border-r border-border/60 bg-sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link to="/" />}>
                <Building2 />
                <span className="font-semibold">Ticketing</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Badge variant="secondary" className="w-fit rounded-full px-2.5 py-1 text-[11px] font-medium">
            {activeWorkspace?.name ?? workspaceSlug}
          </Badge>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {visibleLinks.map((item) => {
              const path = item.to === '.' ? `/workspaces/${workspaceSlug}` : `/workspaces/${workspaceSlug}/${item.to}`;
              const isActive = item.to === '.' ? location.pathname === path : location.pathname.startsWith(path);

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    render={<NavLink to={item.to} end={item.to === '.'} />}
                    isActive={isActive}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <p className="px-2 text-xs text-muted-foreground">Multi-tenant workspace panel</p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-xl">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{activeWorkspace?.name ?? 'Workspace'}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">Support operations</p>
          </div>
          <div className="ml-auto hidden w-[220px] sm:block">
            <Select
              value={workspaceSlug}
              onValueChange={(nextSlug) => {
                if (nextSlug && nextSlug !== workspaceSlug) {
                  navigate(`/workspaces/${nextSlug}`);
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.slug}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </Button>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-5 md:px-8 md:py-7">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
