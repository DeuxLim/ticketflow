import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiRequest } from '@/services/api/client';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const invitationSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role_id: z.string().min(1, 'Select a role'),
});

type InvitationForm = z.infer<typeof invitationSchema>;

type WorkspaceRole = { id: number; name: string; slug: string };
type Invitation = {
  id: number;
  email: string;
  status: string;
  expires_at: string;
  roles: Array<{ id: number; name: string; slug: string }>;
};

export function InvitationsPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canManage = accessQuery.can('invitations.manage');

  const invitationForm = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { role_id: '' },
  });
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = invitationForm;

  const roleId = useWatch({ control: invitationForm.control, name: 'role_id' });

  const rolesQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'roles'],
    queryFn: () => apiRequest<{ data: WorkspaceRole[] }>(`/workspaces/${workspaceSlug}/roles`),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const invitationsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'invitations'],
    queryFn: () => apiRequest<{ data: Invitation[] }>(`/workspaces/${workspaceSlug}/invitations`),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const createInvitation = useMutation({
    mutationFn: (values: InvitationForm) =>
      apiRequest(`/workspaces/${workspaceSlug}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: values.email, role_ids: [Number(values.role_id)] }),
      }),
    onSuccess: () => {
      reset({ email: '', role_id: '' });
      setIsInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'invitations'] });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/workspaces/${workspaceSlug}/invitations/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'invitations'] });
    },
  });

  if (accessQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Checking access...</p>;
  }

  if (!canManage) {
    return (
      <ForbiddenState
        title="Invitations unavailable"
        description="You need the invitations.manage permission to invite or remove workspace members."
      />
    );
  }

  if (invitationsQuery.isError && (invitationsQuery.error instanceof ApiError) && invitationsQuery.error.status === 403) {
    return (
      <ForbiddenState
        title="Invitations unavailable"
        description="Your role can no longer manage invitations in this workspace."
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="secondary">Invitations</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Invite Teammates</h1>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} type="button">
          Send Invite
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Invitation Queue</CardTitle>
          <CardDescription>{invitationsQuery.data?.data.length ?? 0} invitations</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {invitationsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading invitations...</p>
          ) : invitationsQuery.isError ? (
            <p className="text-sm text-destructive">{(invitationsQuery.error as Error).message}</p>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invitationsQuery.data?.data ?? []).map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{invite.roles.map((role) => role.name).join(', ')}</TableCell>
                    <TableCell>
                      <Badge variant={invite.status === 'pending' ? 'secondary' : 'outline'}>{invite.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invite.status === 'pending' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInvitation.mutate(invite.id)}
                          disabled={cancelInvitation.isPending}
                          type="button"
                        >
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          setIsInviteOpen(open);
          if (!open) {
            reset({ email: '', role_id: '' });
          }
        }}
        open={isInviteOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Invite</DialogTitle>
            <DialogDescription>Assign at least one workspace role on invitation.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" id="invite-form" onSubmit={handleSubmit((v) => createInvitation.mutate(v))}>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={roleId}
                onValueChange={(value) =>
                  setValue('role_id', value ?? '', { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(rolesQuery.data?.data ?? []).map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.role_id && <p className="text-xs text-destructive">{errors.role_id.message}</p>}
            </div>
          </form>

          <DialogFooter>
            <Button onClick={() => setIsInviteOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSubmitting || createInvitation.isPending} form="invite-form" type="submit">
              {createInvitation.isPending ? 'Sending…' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
