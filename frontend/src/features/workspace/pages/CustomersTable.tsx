import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
                  <Button onClick={() => onView(customer)} size="sm" variant="outline" type="button">
                    View
                  </Button>
                  <Button disabled={!canManage} onClick={() => onEdit(customer)} size="sm" variant="outline" type="button">
                    Edit
                  </Button>
                  <Button disabled={isDeleting || !canManage} onClick={() => onDelete(customer)} size="sm" variant="outline" type="button">
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
