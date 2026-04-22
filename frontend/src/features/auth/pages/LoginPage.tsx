import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { setAuthToken } from '@/lib/auth-session';
import { getLastWorkspaceSlug, setLastWorkspaceSlug } from '@/lib/workspace-session';
import { apiRequest } from '@/services/api/client';
import type { ApiEnvelope, Workspace } from '@/types/api';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const onSubmit = async (values: LoginForm) => {
    try {
      const payload = await apiRequest<{ data: { token: string; user: { is_platform_admin: boolean } } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      setAuthToken(payload.data.token);

      let destination = fromPath !== '/' ? fromPath : payload.data.user.is_platform_admin ? '/admin' : '/';

      if (fromPath === '/' && !payload.data.user.is_platform_admin) {
        const workspacesPayload = await apiRequest<ApiEnvelope<Workspace[]>>('/workspaces');
        const workspaces = workspacesPayload.data;
        const lastSlug = getLastWorkspaceSlug();
        const preferredWorkspace = workspaces.find((workspace) => workspace.slug === lastSlug) ?? workspaces[0];

        if (preferredWorkspace?.slug) {
          setLastWorkspaceSlug(preferredWorkspace.slug);
          destination = `/workspaces/${preferredWorkspace.slug}`;
        } else {
          destination = '/workspaces/new';
        }
      }

      navigate(destination, { replace: true });
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : 'Login failed.' });
    }
  };

  return (
    <Card className="bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your workspace credentials.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                id="email"
                placeholder="you@example.com"
                spellCheck={false}
                type="email"
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.password)}
                autoComplete="current-password"
                id="password"
                placeholder="Enter your password"
                type="password"
                {...register('password')}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            {errors.root && <FieldError>{errors.root.message}</FieldError>}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={isSubmitting} form="login-form" type="submit">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </CardFooter>
    </Card>
  );
}
