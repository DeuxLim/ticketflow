import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getLastWorkspaceSlug, setLastWorkspaceSlug } from '@/lib/workspace-session';
import { apiRequest } from '@/services/api/client';
import type { ApiEnvelope, Workspace } from '@/types/api';

const workspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
});

type WorkspaceForm = z.infer<typeof workspaceSchema>;

export function WorkspaceOnboardingPage() {
  const navigate = useNavigate();

  const workspacesQuery = useQuery({
    queryKey: ['workspaces', 'onboarding'],
    queryFn: () => apiRequest<ApiEnvelope<Workspace[]>>('/workspaces'),
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
      apiRequest<ApiEnvelope<Workspace>>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: (payload) => {
      const slug = payload.data.slug;
      setLastWorkspaceSlug(slug);
      navigate(`/workspaces/${slug}`, { replace: true });
    },
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
            Workspace context drives tenant isolation for customers, tickets, and memberships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit((values) => createWorkspace.mutate(values))}>
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input id="workspace-name" placeholder="Acme Support" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-slug">Workspace slug</Label>
              <Input id="workspace-slug" placeholder="acme-support" {...register('slug')} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            {createWorkspace.isError && (
              <p className="text-xs text-destructive">
                {(createWorkspace.error as Error).message}
              </p>
            )}

            <Button disabled={isSubmitting || createWorkspace.isPending} type="submit">
              {createWorkspace.isPending ? 'Creating workspace...' : 'Create Workspace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
