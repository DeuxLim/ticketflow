import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { EmptyState, PageHeader } from '@/components/app';
import { ForbiddenState } from '@/components/forbidden-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  createWorkspaceCustomer,
  deleteWorkspaceCustomer,
  listWorkspaceCustomers,
  updateWorkspaceCustomer,
} from '@/features/workspace/api/customerApi';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { ApiError } from '@/services/api/client';
import type { Customer } from '@/types/api';
import { CustomerFormFields } from './CustomerFormFields';
import { CustomerProfileDetails } from './CustomerProfileDetails';
import { CustomersTable } from './CustomersTable';
import {
  applyCustomerFormFieldErrors,
  customerSchema,
  customerToForm,
  emptyCustomerForm,
  formToCustomerPayload,
  type CustomerForm,
} from './customerForm';

export function CustomersPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const accessQuery = useWorkspaceAccess(workspaceSlug);
  const canView = accessQuery.can('customers.view');
  const canManage = accessQuery.can('customers.manage');

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Customer | null>(null);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const createForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: emptyCustomerForm,
  });

  const editForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: emptyCustomerForm,
  });

  const customersQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'customers', search],
    queryFn: () => listWorkspaceCustomers(workspaceSlug ?? '', search),
    enabled: Boolean(workspaceSlug && canView),
  });

  const createCustomer = useMutation({
    mutationFn: (values: CustomerForm) =>
      createWorkspaceCustomer(workspaceSlug ?? '', formToCustomerPayload(values)),
    onSuccess: () => {
      createForm.reset(emptyCustomerForm);
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'customers'] });
    },
    onError: (error) => applyCustomerFormFieldErrors(createForm, error),
  });

  const updateCustomer = useMutation({
    mutationFn: ({ customerId, values }: { customerId: number; values: CustomerForm }) =>
      updateWorkspaceCustomer(workspaceSlug ?? '', customerId, formToCustomerPayload(values)),
    onSuccess: () => {
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'customers'] });
    },
    onError: (error) => applyCustomerFormFieldErrors(editForm, error),
  });

  const deleteCustomer = useMutation({
    mutationFn: (customerId: number) => deleteWorkspaceCustomer(workspaceSlug ?? '', customerId),
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
      <PageHeader
        eyebrow="Workspace Customers"
        title="Customer Directory"
        description="Search, review, and update customer records without mixing the directory view with editing work."
        actions={<Button disabled={!canManage} onClick={() => setIsCreateOpen(true)} type="button">Add Customer</Button>}
      />

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Customers</CardTitle>
          <CardDescription>Use the directory to scan records quickly, then open focused dialogs when you need to change details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          <Field className="max-w-sm">
            <FieldLabel htmlFor="customer-search">Search customers</FieldLabel>
            <Input
              id="customer-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or company..."
              value={search}
            />
            <FieldDescription>Search covers identity, account references, support tier, and lifecycle status.</FieldDescription>
          </Field>

          {customersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading customers...</p>
          ) : customersQuery.isError ? (
            <p className="text-sm text-destructive">{(customersQuery.error as Error).message}</p>
          ) : customers.length === 0 ? (
            <EmptyState
              title="No customers found."
              description="No customers match the current search. Try a broader term or add a new customer."
            />
          ) : (
            <CustomersTable
              canManage={canManage}
              customers={customers}
              isDeleting={deleteCustomer.isPending}
              onDelete={setDeleteTarget}
              onEdit={(customer) => {
                setEditTarget(customer);
                editForm.reset(customerToForm(customer));
              }}
              onView={setViewTarget}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            createForm.reset(emptyCustomerForm);
          }
        }}
        open={isCreateOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Create a reusable customer record so ticket assignment and history stay attached to the right account.</DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-5"
            id="create-customer-form"
            onSubmit={createForm.handleSubmit((values) => createCustomer.mutate(values))}
          >
            <CustomerFormFields form={createForm} formId="create-customer" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update the record used by ticket search, routing, and reporting.</DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-5"
            id="edit-customer-form"
            onSubmit={editForm.handleSubmit((values) => {
              if (editTarget) {
                updateCustomer.mutate({ customerId: editTarget.id, values });
              }
            })}
          >
            <CustomerFormFields form={editForm} formId="edit-customer" />
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
            setViewTarget(null);
          }
        }}
        open={Boolean(viewTarget)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewTarget?.name ?? 'Customer profile'}</DialogTitle>
            <DialogDescription>Review customer context without changing ticket assignment flows.</DialogDescription>
          </DialogHeader>

          {viewTarget ? <CustomerProfileDetails customer={viewTarget} /> : null}

          <DialogFooter>
            <Button onClick={() => setViewTarget(null)} type="button" variant="outline">Close</Button>
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
