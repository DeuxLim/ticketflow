import { PriorityBadge, RowActionMenu, StatusBadge } from '@/components/app';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Customer } from '@/types/api';

export function CustomersTable({
  canManage,
  customers,
  isDeleting,
  onDelete,
  onEdit,
  onView,
}: {
  canManage: boolean;
  customers: Customer[];
  isDeleting: boolean;
  onDelete: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
}) {
  return (
    <>
    <div className="hidden overflow-x-auto md:block">
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
                  <PriorityBadge priority={customer.support_tier ?? 'No tier'} />
                  <StatusBadge status={customer.status ?? 'closed'} label={customer.status ?? 'No status'} />
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
                <div className="flex justify-end">
                  <CustomerActions
                    customer={customer}
                    canManage={canManage}
                    isDeleting={isDeleting}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onView={onView}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    <div className="grid gap-3 md:hidden">
      {customers.map((customer) => (
        <article key={customer.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{customer.name}</p>
              <p className="truncate text-sm text-muted-foreground">{customer.email ?? 'No email'}</p>
            </div>
            <CustomerActions
              customer={customer}
              canManage={canManage}
              isDeleting={isDeleting}
              onDelete={onDelete}
              onEdit={onEdit}
              onView={onView}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <PriorityBadge priority={customer.support_tier ?? 'No tier'} />
            <StatusBadge status={customer.status ?? 'closed'} label={customer.status ?? 'No status'} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Company</dt>
              <dd className="mt-1 truncate font-medium">{customer.company ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Contact</dt>
              <dd className="mt-1 truncate font-medium">{customer.preferred_contact_method ?? customer.phone ?? '—'}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
    </>
  );
}

function CustomerActions({
  customer,
  canManage,
  isDeleting,
  onDelete,
  onEdit,
  onView,
}: {
  customer: Customer;
  canManage: boolean;
  isDeleting: boolean;
  onDelete: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
}) {
  return (
    <RowActionMenu
      label={`Actions for ${customer.name}`}
      actions={[
        { label: 'View', onSelect: () => onView(customer) },
        { label: 'Edit', onSelect: () => onEdit(customer), disabled: !canManage },
        { label: 'Delete', onSelect: () => onDelete(customer), disabled: isDeleting || !canManage, destructive: true },
      ]}
    />
  );
}
