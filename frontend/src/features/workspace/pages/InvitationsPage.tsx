import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { ConfirmDialog, EmptyState, PageHeader, RowActionMenu, StatusBadge } from '@/components/app';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import {
  cancelWorkspaceInvitation,
  createWorkspaceInvitation,
  listWorkspaceInvitations,
  listWorkspaceRoles,
} from '@/features/workspace/api/invitationsApi';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/services/api/client';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const invitationSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role_id: z.string().min(1, 'Select a role'),
});

type InvitationForm = z.infer<typeof invitationSchema>;

function applyInvitationFieldErrors(form: UseFormReturn<InvitationForm>, error: unknown) {
  if (!(error instanceof ApiError)) return;

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (!messages.length) continue;
    if (field === 'email' || field === 'role_id') {
      form.setError(field, { type: 'server', message: messages[0] });
    }
  }
}

export function InvitationsPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<WorkspaceInvitation | null>(null);
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
    queryFn: () => listWorkspaceRoles(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const invitationsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'invitations'],
    queryFn: () => listWorkspaceInvitations(workspaceSlug ?? ''),
    enabled: Boolean(workspaceSlug && canManage),
  });

  const createInvitation = useMutation({
    mutationFn: (values: InvitationForm) =>
      createWorkspaceInvitation(workspaceSlug ?? '', values.email, Number(values.role_id)),
    onSuccess: () => {
      reset({ email: '', role_id: '' });
      setIsInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'invitations'] });
    },
    onError: (error) => applyInvitationFieldErrors(invitationForm, error),
  });

  const cancelInvitation = useMutation({
    mutationFn: (id: number) => cancelWorkspaceInvitation(workspaceSlug ?? '', id),
    onSuccess: () => {
      setInvitationToCancel(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'invitations'] });
    },
  });

  const invitations = invitationsQuery.data?.data ?? [];

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
      <PageHeader
        eyebrow="Invitations"
        title="Invite Teammates"
        description="Keep access rollout focused by inviting people with the right starting role instead of exposing membership controls on the page."
        actions={<Button onClick={() => setIsInviteOpen(true)} type="button">Send Invite</Button>}
      />

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Invitation Queue</CardTitle>
          <CardDescription>Track pending invites, role assignments, and cancellations in one place.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {invitationsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading invitations...</p>
          ) : invitationsQuery.isError ? (
            <p className="text-sm text-destructive">{(invitationsQuery.error as Error).message}</p>
          ) : invitations.length === 0 ? (
            <EmptyState title="No invitations yet." description='Use "Send Invite" to bring in the next teammate.' />
          ) : (
            <InvitationsList
              invitations={invitations}
              isCancelling={cancelInvitation.isPending}
              onCancel={setInvitationToCancel}
            />
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
            <FieldGroup>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="invite-email">Invitee email</FieldLabel>
              <Input id="invite-email" type="email" placeholder="teammate@company.com" {...register('email')} />
              <FieldDescription>We will send the invitation to this address.</FieldDescription>
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={Boolean(errors.role_id)}>
              <FieldLabel htmlFor="invite-role">Starting role</FieldLabel>
              <Select
                value={roleId}
                onValueChange={(value) =>
                  setValue('role_id', value ?? '', { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full" id="invite-role">
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
              <FieldDescription>Choose the access level the teammate should have as soon as they accept.</FieldDescription>
              <FieldError errors={[errors.role_id]} />
            </Field>
            </FieldGroup>
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

      <ConfirmDialog
        open={Boolean(invitationToCancel)}
        onOpenChange={(open) => {
          if (!open) setInvitationToCancel(null);
        }}
        title="Cancel invitation?"
        description={invitationToCancel ? `This will cancel the pending invite for ${invitationToCancel.email}.` : 'This pending invite will be cancelled.'}
        confirmLabel="Cancel Invite"
        isPending={cancelInvitation.isPending}
        variant="destructive"
        onConfirm={() => {
          if (invitationToCancel) {
            cancelInvitation.mutate(invitationToCancel.id);
          }
        }}
      />
    </section>
  );
}

type WorkspaceInvitation = Awaited<ReturnType<typeof listWorkspaceInvitations>>['data'][number];

function InvitationsList({
  invitations,
  isCancelling,
  onCancel,
}: {
  invitations: WorkspaceInvitation[];
  isCancelling: boolean;
  onCancel: (invitation: WorkspaceInvitation) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell>
                  <InvitationRoleBadges invitation={invite} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={invite.status} label={invite.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <InvitationActions invitation={invite} isCancelling={isCancelling} onCancel={onCancel} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {invitations.map((invite) => (
          <article key={invite.id} aria-label={`Invitation ${invite.email}`} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{invite.email}</p>
                <div className="mt-2">
                  <StatusBadge status={invite.status} label={invite.status} />
                </div>
              </div>
              <InvitationActions invitation={invite} isCancelling={isCancelling} onCancel={onCancel} />
            </div>
            <div className="mt-3">
              <InvitationRoleBadges invitation={invite} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function InvitationRoleBadges({ invitation }: { invitation: WorkspaceInvitation }) {
  return (
    <div className="flex flex-wrap gap-1">
      {invitation.roles.map((role) => (
        <Badge key={role.id} variant="outline">{role.name}</Badge>
      ))}
    </div>
  );
}

function InvitationActions({
  invitation,
  isCancelling,
  onCancel,
}: {
  invitation: WorkspaceInvitation;
  isCancelling: boolean;
  onCancel: (invitation: WorkspaceInvitation) => void;
}) {
  if (invitation.status !== 'pending') {
    return <span className="text-sm text-muted-foreground">No actions</span>;
  }

  return (
    <RowActionMenu
      label={`Actions for invitation ${invitation.email}`}
      actions={[
        {
          label: 'Cancel invite',
          onSelect: () => onCancel(invitation),
          disabled: isCancelling,
          destructive: true,
        },
      ]}
    />
  );
}
