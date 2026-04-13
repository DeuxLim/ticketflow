import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ApiEnvelope, Customer } from '@/types/api';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  company: z.string().optional(),
  phone: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

export function CustomersPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canView = accessQuery.can('customers.view');
  const canManage = accessQuery.can('customers.manage');

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const createForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', email: '', company: '', phone: '' },
  });

  const editForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', email: '', company: '', phone: '' },
  });

  const customersPath = useMemo(() => {
    const query = search.trim();
    if (!query) {
      return `/workspaces/${workspaceSlug}/customers`;
    }
    return `/workspaces/${workspaceSlug}/customers?search=${encodeURIComponent(query)}`;
  }, [workspaceSlug, search]);

  const customersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'customers', search],
    queryFn: () => apiRequest<ApiEnvelope<Customer[]>>(customersPath),
    enabled: Boolean(workspaceSlug && canView),
  });

  const createCustomer = useMutation({
    mutationFn: (values: CustomerForm) =>
      apiRequest(`/workspaces/${workspaceSlug}/customers`, {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          email: values.email || null,
          company: values.company || null,
          phone: values.phone || null,
        }),
      }),
    onSuccess: () => {
      createForm.reset({ name: '', email: '', company: '', phone: '' });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'customers'] });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: ({ customerId, values }: { customerId: number; values: CustomerForm }) =>
      apiRequest(`/workspaces/${workspaceSlug}/customers/${customerId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: values.name,
          email: values.email || null,
          company: values.company || null,
          phone: values.phone || null,
        }),
      }),
    onSuccess: () => {
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'customers'] });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: (customerId: number) =>
      apiRequest<{ message: string }>(`/workspaces/${workspaceSlug}/customers/${customerId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'customers'] });
    },
  });

  const customers = customersQuery.data?.data ?? [];

  if (accessQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Checking access...</p>;
  }

  if (!canView) {
    return (
      <ForbiddenState
        title="Customers unavailable"
        description="You need the customers.view permission to access customer records in this workspace."
      />
    );
  }

  if (customersQuery.isError && customersQuery.error instanceof ApiError && customersQuery.error.status === 403) {
    return (
      <ForbiddenState
        title="Customers unavailable"
        description="Your role can no longer access customer records for this workspace."
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="secondary">Workspace Customers</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Customer Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search, update, and manage customer records in this workspace.</p>
        </div>
        <Button disabled={!canManage} onClick={() => setIsCreateOpen(true)} type="button">
          Add Customer
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Customers</CardTitle>
          <CardDescription>{customers.length} records</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="max-w-sm">
            <Input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or company…"
              value={search}
            />
          </div>

          {customersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading customers...</p>
          ) : customersQuery.isError ? (
            <p className="text-sm text-destructive">{(customersQuery.error as Error).message}</p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers found.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email ?? '—'}</TableCell>
                    <TableCell>{customer.phone ?? '—'}</TableCell>
                    <TableCell>{customer.company ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                      <Button
                        disabled={!canManage}
                        onClick={() => {
                          setEditTarget(customer);
                          editForm.reset({
                            name: customer.name,
                            email: customer.email ?? '',
                            company: customer.company ?? '',
                            phone: customer.phone ?? '',
                          });
                        }}
                        size="sm"
                        variant="outline"
                        type="button"
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={deleteCustomer.isPending || !canManage}
                        onClick={() => setDeleteTarget(customer)}
                        size="sm"
                        variant="outline"
                        type="button"
                      >
                        Delete
                      </Button>
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

      <Dialog
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            createForm.reset({ name: '', email: '', company: '', phone: '' });
          }
        }}
        open={isCreateOpen}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Create a customer record for faster ticket association.</DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4 md:grid-cols-2"
            id="create-customer-form"
            onSubmit={createForm.handleSubmit((values) => createCustomer.mutate(values))}
          >
            <CustomerFormFields errors={createForm.formState.errors} register={createForm.register} />
          </form>

          {createCustomer.isError && (
            <p className="text-xs text-destructive">{(createCustomer.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button onClick={() => setIsCreateOpen(false)} type="button" variant="outline">Cancel</Button>
            <Button
              disabled={createForm.formState.isSubmitting || createCustomer.isPending}
              form="create-customer-form"
              type="submit"
            >
              {createCustomer.isPending ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        open={Boolean(editTarget)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details used by ticket workflows.</DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4 md:grid-cols-2"
            id="edit-customer-form"
            onSubmit={editForm.handleSubmit((values) => {
              if (editTarget) {
                updateCustomer.mutate({ customerId: editTarget.id, values });
              }
            })}
          >
            <CustomerFormFields errors={editForm.formState.errors} register={editForm.register} />
          </form>

          {updateCustomer.isError && (
            <p className="text-xs text-destructive">{(updateCustomer.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button onClick={() => setEditTarget(null)} type="button" variant="outline">Cancel</Button>
            <Button
              disabled={updateCustomer.isPending || editForm.formState.isSubmitting || !editTarget}
              form="edit-customer-form"
              type="submit"
            >
              {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete customer</DialogTitle>
            <DialogDescription>
              This will permanently remove <span className="font-medium text-foreground">{deleteTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          {deleteCustomer.isError && (
            <p className="text-xs text-destructive">{(deleteCustomer.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button onClick={() => setDeleteTarget(null)} type="button" variant="outline">Cancel</Button>
            <Button
              disabled={deleteCustomer.isPending || !deleteTarget}
              onClick={() => {
                if (deleteTarget) {
                  deleteCustomer.mutate(deleteTarget.id);
                }
              }}
              type="button"
              variant="destructive"
            >
              {deleteCustomer.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CustomerFormFields({
  register,
  errors,
}: {
  register: UseFormRegister<CustomerForm>;
  errors: FieldErrors<CustomerForm>;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="customer-name">Name</Label>
        <Input id="customer-name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-email">Email</Label>
        <Input id="customer-email" type="email" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-company">Company</Label>
        <Input id="customer-company" {...register('company')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-phone">Phone</Label>
        <Input id="customer-phone" {...register('phone')} />
      </div>
    </>
  );
}
