import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { ApiError } from '@/services/api/client';
import { listWorkspaceMembers } from '@/features/workspace/pages/membersApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function MembersPage() {
  const { workspaceSlug } = useParams();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canManageMembers = accessQuery.can('members.manage');

  const query = useQuery({
    queryKey: ['workspace', workspaceSlug, 'members'],
    queryFn: () => listWorkspaceMembers(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManageMembers),
  });

  const members = query.data?.data ?? [];

  if (accessQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Checking access...</p>;
  }

  if (!canManageMembers) {
    return (
      <ForbiddenState
        title="Members unavailable"
        description="You need the members.manage permission to view workspace membership details."
      />
    );
  }

  if (query.isError && (query.error instanceof ApiError) && query.error.status === 403) {
    return (
      <ForbiddenState
        title="Members unavailable"
        description="Your role can no longer view member management data for this workspace."
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Badge variant="secondary">Membership</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Workspace Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review who has access to the workspace and which roles shape what they can do.
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Members</CardTitle>
          <CardDescription>Scan workspace access quickly without opening separate management forms.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : query.isError ? (
            <p className="text-sm text-destructive">{(query.error as Error).message}</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active members are assigned to this workspace yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.user.first_name} {member.user.last_name}</TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <Badge key={role.id} variant="outline">{role.name}</Badge>
                      ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
