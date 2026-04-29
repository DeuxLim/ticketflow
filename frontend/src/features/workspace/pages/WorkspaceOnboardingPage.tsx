import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { createWorkspace as createWorkspaceRequest, listUserWorkspaces } from '@/features/workspace/api/workspaceOnboardingApi';
import { getLastWorkspaceSlug, setLastWorkspaceSlug } from '@/lib/workspace-session';
import { ApiError } from '@/services/api/client';

const workspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
});

type WorkspaceForm = z.infer<typeof workspaceSchema>;

function applyWorkspaceFieldErrors(form: UseFormReturn<WorkspaceForm>, error: unknown) {
  if (!(error instanceof ApiError)) return;

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (!messages.length) continue;
    if (field === 'name' || field === 'slug') {
      form.setError(field, { type: 'server', message: messages[0] });
    }
  }
}

export function WorkspaceOnboardingPage() {
  const navigate = useNavigate();

  const workspacesQuery = useQuery({
    queryKey: ['workspaces', 'onboarding'],
    queryFn: () => listUserWorkspaces(),
  });

  const workspaceForm = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: '', slug: '' },
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = workspaceForm;

  const createWorkspace = useMutation({
    mutationFn: (values: WorkspaceForm) =>
      createWorkspaceRequest(values),
    onSuccess: (payload) => {
      const slug = payload.data.slug;
      setLastWorkspaceSlug(slug);
      navigate(`/workspaces/${slug}`, { replace: true });
    },
    onError: (error) => applyWorkspaceFieldErrors(workspaceForm, error),
  });

  const name = useWatch({ control: workspaceForm.control, name: 'name' });
  const slug = useWatch({ control: workspaceForm.control, name: 'slug' });

  useEffect(() => {
    const normalized = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);

    if (!slug || slug === normalized || slug === slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-')) {
      setValue('slug', normalized, { shouldValidate: false });
    }
  }, [name, setValue, slug]);

  if (workspacesQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Preparing workspace setup...</p>;
  }

  const workspaces = workspacesQuery.data?.data ?? [];
  if (workspaces.length > 0) {
    const lastSlug = getLastWorkspaceSlug();
    const preferred = workspaces.find((workspace) => workspace.slug === lastSlug)?.slug ?? workspaces[0]?.slug;
    return <Navigate replace to={`/workspaces/${preferred}`} />;
  }

  return (
    <section className="mx-auto mt-12 w-full max-w-xl">
      <Card className="shadow-none">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">Onboarding</Badge>
          <CardTitle className="mt-2 text-2xl">Create your first workspace</CardTitle>
          <CardDescription>
            Set the support hub your team will use for customers, tickets, members, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="workspace-onboarding-form" onSubmit={handleSubmit((values) => createWorkspace.mutate(values))}>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
                <Input
                  aria-invalid={Boolean(errors.name)}
                  autoComplete="organization"
                  id="workspace-name"
                  placeholder="Acme Support"
                  {...register('name')}
                />
                <FieldDescription>This is the human-friendly name shown in navigation and settings.</FieldDescription>
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={Boolean(errors.slug)}>
                <FieldLabel htmlFor="workspace-slug">Workspace URL slug</FieldLabel>
                <Input
                  aria-invalid={Boolean(errors.slug)}
                  autoComplete="off"
                  id="workspace-slug"
                  placeholder="acme-support"
                  spellCheck={false}
                  {...register('slug')}
                />
                <FieldDescription>Used in the workspace URL. Use lowercase letters, numbers, and hyphens.</FieldDescription>
                <FieldError errors={[errors.slug]} />
              </Field>

              {createWorkspace.isError && <FieldError>{(createWorkspace.error as Error).message}</FieldError>}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2">
          <Button disabled={isSubmitting || createWorkspace.isPending} form="workspace-onboarding-form" type="submit">
            {createWorkspace.isPending ? 'Creating workspace...' : 'Create workspace'}
          </Button>
          <p className="text-xs text-muted-foreground">
            You can invite teammates, configure ticket types, and adjust branding after the workspace is created.
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
