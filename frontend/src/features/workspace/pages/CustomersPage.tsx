import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { ForbiddenState } from '@/components/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useWorkspaceAccess } from '@/hooks/use-workspace-access';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  type CustomerPayload,
  createWorkspaceCustomer,
  deleteWorkspaceCustomer,
  listWorkspaceCustomers,
  updateWorkspaceCustomer,
} from '@/features/workspace/pages/customerApi';
import { ApiError } from '@/services/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Customer } from '@/types/api';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  company: z.string().optional(),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
  preferred_contact_method: z.string().optional(),
  preferred_language: z.string().optional(),
  address: z.string().optional(),
  external_reference: z.string().optional(),
  support_tier: z.string().optional(),
  status: z.string().optional(),
  internal_notes: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

const emptyCustomerForm: CustomerForm = {
  name: '',
  email: '',
  company: '',
  phone: '',
  job_title: '',
  website: '',
  timezone: '',
  preferred_contact_method: '',
  preferred_language: '',
  address: '',
  external_reference: '',
  support_tier: '',
  status: '',
  internal_notes: '',
};

const customerFormFields = Object.keys(emptyCustomerForm) as Array<keyof CustomerForm>;
const emptySelectValue = '__none__';
const contactMethods = ['email', 'phone', 'portal', 'sms'] as const;
const supportTiers = ['standard', 'priority', 'enterprise', 'strategic'] as const;
const lifecycleStatuses = ['active', 'onboarding', 'at_risk', 'inactive'] as const;

function nullable(value?: string): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

function customerToForm(customer: Customer): CustomerForm {
  return {
    name: customer.name,
    email: customer.email ?? '',
    company: customer.company ?? '',
    phone: customer.phone ?? '',
    job_title: customer.job_title ?? '',
    website: customer.website ?? '',
    timezone: customer.timezone ?? '',
    preferred_contact_method: customer.preferred_contact_method ?? '',
    preferred_language: customer.preferred_language ?? '',
    address: customer.address ?? '',
    external_reference: customer.external_reference ?? '',
    support_tier: customer.support_tier ?? '',
    status: customer.status ?? '',
    internal_notes: customer.internal_notes ?? '',
  };
}

function formToCustomerPayload(values: CustomerForm): CustomerPayload {
  return {
    name: values.name,
    email: nullable(values.email),
    company: nullable(values.company),
    phone: nullable(values.phone),
    job_title: nullable(values.job_title),
    website: nullable(values.website),
    timezone: nullable(values.timezone),
    preferred_contact_method: nullable(values.preferred_contact_method),
    preferred_language: nullable(values.preferred_language),
    address: nullable(values.address),
    external_reference: nullable(values.external_reference),
    support_tier: nullable(values.support_tier),
    status: nullable(values.status),
    internal_notes: nullable(values.internal_notes),
  };
}

function applyCustomerFormFieldErrors(form: UseFormReturn<CustomerForm>, error: unknown) {
  if (!(error instanceof ApiError)) return;

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (!messages.length) continue;

    const customerField = field as keyof CustomerForm;
    if (customerFormFields.includes(customerField)) {
      form.setError(customerField, { type: 'server', message: messages[0] });
    }
  }
}

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="secondary">Workspace Customers</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Customer Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search, review, and update customer records without mixing the directory view with editing work.</p>
        </div>
        <Button disabled={!canManage} onClick={() => setIsCreateOpen(true)} type="button">
          Add Customer
        </Button>
      </div>

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
            <p className="text-sm text-muted-foreground">No customers match the current search. Try a broader term or add a new customer.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Support</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.job_title ?? '—'}</div>
                    </TableCell>
                    <TableCell>{customer.email ?? '—'}</TableCell>
                    <TableCell>
                      <div>{customer.company ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{customer.external_reference ?? customer.website ?? '—'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{customer.support_tier ?? 'No tier'}</Badge>
                        <Badge variant={customer.status ? 'secondary' : 'outline'}>{customer.status ?? 'No status'}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{customer.preferred_contact_method ?? customer.phone ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{customer.timezone ?? customer.preferred_language ?? '—'}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setViewTarget(customer)}
                        size="sm"
                        variant="outline"
                        type="button"
                      >
                        View
                      </Button>
                      <Button
                        disabled={!canManage}
                        onClick={() => {
                          setEditTarget(customer);
                          editForm.reset(customerToForm(customer));
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

function CustomerFormFields({
  form,
  formId,
}: {
  form: UseFormReturn<CustomerForm>;
  formId: string;
}) {
  const { formState, register, setValue, watch } = form;
  const errors = formState.errors;

  return (
    <>
      <FormSection title="Identity">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor={`${formId}-name`}>Customer name</FieldLabel>
          <Input id={`${formId}-name`} {...register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor={`${formId}-email`}>Email address</FieldLabel>
          <Input id={`${formId}-email`} type="email" placeholder="ops@acme.com" {...register('email')} />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-phone`}>Phone</FieldLabel>
          <Input id={`${formId}-phone`} placeholder="+63 917 000 0000" {...register('phone')} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-job-title`}>Job title</FieldLabel>
          <Input id={`${formId}-job-title`} placeholder="Operations Lead" {...register('job_title')} />
        </Field>
      </FormSection>

      <FormSection title="Account">
        <Field>
          <FieldLabel htmlFor={`${formId}-company`}>Company</FieldLabel>
          <Input id={`${formId}-company`} placeholder="Acme Inc." {...register('company')} />
        </Field>

        <Field data-invalid={Boolean(errors.website)}>
          <FieldLabel htmlFor={`${formId}-website`}>Website</FieldLabel>
          <Input id={`${formId}-website`} placeholder="https://acme.com" {...register('website')} />
          <FieldError errors={[errors.website]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-external-reference`}>External reference</FieldLabel>
          <Input id={`${formId}-external-reference`} placeholder="CRM-1001" {...register('external_reference')} />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`${formId}-address`}>Address</FieldLabel>
          <Textarea id={`${formId}-address`} placeholder="Customer billing or office address" {...register('address')} />
        </Field>
      </FormSection>

      <FormSection title="Preferences">
        <Field>
          <FieldLabel htmlFor={`${formId}-preferred-contact-method`}>Preferred contact</FieldLabel>
          <Select
            value={watch('preferred_contact_method') || emptySelectValue}
            onValueChange={(value) => setValue('preferred_contact_method', value === emptySelectValue ? '' : (value ?? ''))}
          >
            <SelectTrigger id={`${formId}-preferred-contact-method`} className="w-full">
              <SelectValue placeholder="Select contact method" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={emptySelectValue}>Not set</SelectItem>
                {contactMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-timezone`}>Timezone</FieldLabel>
          <Input id={`${formId}-timezone`} placeholder="Asia/Manila" {...register('timezone')} />
          <FieldDescription>Use an IANA timezone such as Asia/Manila.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-preferred-language`}>Preferred language</FieldLabel>
          <Input id={`${formId}-preferred-language`} placeholder="English" {...register('preferred_language')} />
        </Field>
      </FormSection>

      <FormSection title="Support">
        <Field>
          <FieldLabel htmlFor={`${formId}-support-tier`}>Support tier</FieldLabel>
          <Select
            value={watch('support_tier') || emptySelectValue}
            onValueChange={(value) => setValue('support_tier', value === emptySelectValue ? '' : (value ?? ''))}
          >
            <SelectTrigger id={`${formId}-support-tier`} className="w-full">
              <SelectValue placeholder="Select support tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={emptySelectValue}>Not set</SelectItem>
                {supportTiers.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-status`}>Lifecycle status</FieldLabel>
          <Select
            value={watch('status') || emptySelectValue}
            onValueChange={(value) => setValue('status', value === emptySelectValue ? '' : (value ?? ''))}
          >
            <SelectTrigger id={`${formId}-status`} className="w-full">
              <SelectValue placeholder="Select lifecycle status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={emptySelectValue}>Not set</SelectItem>
                {lifecycleStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`${formId}-internal-notes`}>Internal notes</FieldLabel>
          <Textarea id={`${formId}-internal-notes`} placeholder="Private support context for workspace operators" {...register('internal_notes')} />
          <FieldDescription>Internal only. These notes are not used in ticket selectors.</FieldDescription>
        </Field>
      </FormSection>
    </>
  );
}

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
      <h3 className="text-sm font-medium md:col-span-2">{title}</h3>
      {children}
    </div>
  );
}

function CustomerProfileDetails({ customer }: { customer: Customer }) {
  return (
    <div className="grid gap-4">
      <DetailSection title="Identity">
        <DetailItem label="Name" value={customer.name} />
        <DetailItem label="Email" value={customer.email} />
        <DetailItem label="Phone" value={customer.phone} />
        <DetailItem label="Job title" value={customer.job_title} />
      </DetailSection>

      <DetailSection title="Account">
        <DetailItem label="Company" value={customer.company} />
        <DetailItem label="Website" value={customer.website} />
        <DetailItem label="External reference" value={customer.external_reference} />
        <DetailItem label="Address" value={customer.address} wide />
      </DetailSection>

      <DetailSection title="Preferences">
        <DetailItem label="Preferred contact" value={customer.preferred_contact_method} />
        <DetailItem label="Timezone" value={customer.timezone} />
        <DetailItem label="Preferred language" value={customer.preferred_language} />
      </DetailSection>

      <DetailSection title="Support">
        <DetailItem label="Support tier" value={customer.support_tier} />
        <DetailItem label="Lifecycle status" value={customer.status} />
        <DetailItem label="Internal notes" value={customer.internal_notes} wide />
      </DetailSection>
    </div>
  );
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
      <h3 className="text-sm font-medium md:col-span-2">{title}</h3>
      {children}
    </div>
  );
}

function DetailItem({ label, value, wide = false }: { label: string; value: string | null | undefined; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value || '—'}</p>
    </div>
  );
}
