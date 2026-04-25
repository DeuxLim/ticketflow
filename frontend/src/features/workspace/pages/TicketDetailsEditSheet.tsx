import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { customFieldOptions, type TicketForm } from '@/features/workspace/pages/ticketForm';
import type {
  Customer,
  Ticket,
  TicketCategoryConfig,
  TicketCustomFieldConfig,
  TicketFormTemplateConfig,
  TicketQueueConfig,
  TicketTagConfig,
} from '@/types/api';

type MemberOption = {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<TicketForm>;
  onSubmit: (values: TicketForm) => void;
  isPending: boolean;
  errorMessage: string | null;
  customers: Customer[];
  customersCoverageHint: string | null;
  members: MemberOption[];
  ticketAssignee: Ticket['assignee'];
  activeTemplateConfigs: TicketFormTemplateConfig[];
  effectiveEditTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  editCustomerIdValue?: string;
  editAssigneeIdValue?: string;
  editStatusValue?: TicketForm['status'];
  editPriorityValue?: TicketForm['priority'];
  editCategoryValue: string;
  editQueueValue: string;
  editCustomFieldsValue?: Record<string, string>;
  activeCategoryConfigs: TicketCategoryConfig[];
  hasLegacyEditCategoryValue: boolean;
  activeQueueConfigs: TicketQueueConfig[];
  hasLegacyEditQueueValue: boolean;
  activeTagConfigs: TicketTagConfig[];
  scopedCustomFieldConfigs: TicketCustomFieldConfig[];
};

export function TicketDetailsEditSheet({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
  errorMessage,
  customers,
  customersCoverageHint,
  members,
  ticketAssignee,
  activeTemplateConfigs,
  effectiveEditTemplateId,
  onTemplateChange,
  editCustomerIdValue,
  editAssigneeIdValue,
  editStatusValue,
  editPriorityValue,
  editCategoryValue,
  editQueueValue,
  editCustomFieldsValue,
  activeCategoryConfigs,
  hasLegacyEditCategoryValue,
  activeQueueConfigs,
  hasLegacyEditQueueValue,
  activeTagConfigs,
  scopedCustomFieldConfigs,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Edit Ticket</SheetTitle>
          <SheetDescription>Update assignment, priority, status, and operational metadata without losing sight of the ticket.</SheetDescription>
        </SheetHeader>

        <form className="grid gap-4 md:grid-cols-2" id="edit-ticket-details-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              onValueChange={(value) => form.setValue('customer_id', value ?? '', { shouldValidate: true })}
              value={editCustomerIdValue ?? ''}
            >
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {customersCoverageHint && <p className="text-xs text-muted-foreground">{customersCoverageHint}</p>}
            {form.formState.errors.customer_id && <p className="text-xs text-destructive">{form.formState.errors.customer_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select
              onValueChange={(value) => form.setValue('assigned_to_user_id', value === 'none' || value === null ? '' : value)}
              value={editAssigneeIdValue || 'none'}
            >
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {ticketAssignee && !members.some((member) => member.user.id === ticketAssignee.id) && (
                    <SelectItem value={String(ticketAssignee.id)}>
                      {ticketAssignee.first_name} {ticketAssignee.last_name}
                    </SelectItem>
                  )}
                  {members.map((member) => (
                    <SelectItem key={member.user.id} value={String(member.user.id)}>
                      {member.user.first_name} {member.user.last_name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details-template">Form Template</Label>
            <Select onValueChange={(value) => onTemplateChange(value ?? 'none')} value={effectiveEditTemplateId}>
              <SelectTrigger id="details-template"><SelectValue placeholder="All active fields" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">All active fields</SelectItem>
                  {activeTemplateConfigs.map((template) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details-title">Title</Label>
            <Input id="details-title" {...form.register('title')} />
            {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select onValueChange={(value) => form.setValue('status', value as TicketForm['status'])} value={editStatusValue ?? 'open'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select onValueChange={(value) => form.setValue('priority', value as TicketForm['priority'])} value={editPriorityValue ?? 'medium'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details-category">Category</Label>
            <Select onValueChange={(value) => form.setValue('category', value === 'none' || value === null ? '' : value)} value={editCategoryValue}>
              <SelectTrigger id="details-category"><SelectValue placeholder="No category" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">No category</SelectItem>
                  {activeCategoryConfigs.map((category) => (
                    <SelectItem key={category.id} value={category.key}>
                      {category.name}
                    </SelectItem>
                  ))}
                  {hasLegacyEditCategoryValue && <SelectItem value={editCategoryValue}>{editCategoryValue} (legacy)</SelectItem>}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details-queue">Queue</Label>
            <Select onValueChange={(value) => form.setValue('queue_key', value === 'none' || value === null ? '' : value)} value={editQueueValue}>
              <SelectTrigger id="details-queue"><SelectValue placeholder="Default queue" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">Default queue</SelectItem>
                  {activeQueueConfigs.map((queue) => (
                    <SelectItem key={queue.id} value={queue.key}>
                      {queue.name}
                    </SelectItem>
                  ))}
                  {hasLegacyEditQueueValue && <SelectItem value={editQueueValue}>{editQueueValue} (legacy)</SelectItem>}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="details-description">Description</Label>
            <Textarea id="details-description" {...form.register('description')} />
            {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="details-tags">Tags (comma separated)</Label>
            <Input id="details-tags" list="details-tag-options" placeholder="network, vpn, urgent" {...form.register('tags')} />
            {activeTagConfigs.length > 0 && (
              <>
                <datalist id="details-tag-options">
                  {activeTagConfigs.map((tag) => (
                    <option key={tag.id} value={tag.name} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">Available tags: {activeTagConfigs.map((tag) => tag.name).join(', ')}</p>
              </>
            )}
          </div>

          {scopedCustomFieldConfigs.length > 0 && (
            <div className="space-y-3 md:col-span-2">
              <p className="text-sm font-medium">Dynamic Fields</p>
              <div className="grid gap-3 md:grid-cols-2">
                {scopedCustomFieldConfigs.map((field) => {
                  const fieldPath = `custom_fields.${field.key}` as const;

                  if (field.field_type === 'textarea') {
                    return (
                      <div key={field.id} className="space-y-2 md:col-span-2">
                        <Label htmlFor={`custom-field-${field.key}`}>{field.label}</Label>
                        <Textarea id={`custom-field-${field.key}`} {...form.register(fieldPath)} />
                      </div>
                    );
                  }

                  if (field.field_type === 'select') {
                    const options = customFieldOptions(field);
                    const value = editCustomFieldsValue?.[field.key] ?? '';
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`custom-field-${field.key}`}>{field.label}</Label>
                        <Select
                          onValueChange={(nextValue) => form.setValue(fieldPath, nextValue === 'none' || nextValue === null ? '' : nextValue)}
                          value={value || 'none'}
                        >
                          <SelectTrigger id={`custom-field-${field.key}`}><SelectValue placeholder="Not set" /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="none">Not set</SelectItem>
                              {options.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  if (field.field_type === 'checkbox') {
                    const value = editCustomFieldsValue?.[field.key] ?? '';
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`custom-field-${field.key}`}>{field.label}</Label>
                        <Select
                          onValueChange={(nextValue) => form.setValue(fieldPath, nextValue === 'none' || nextValue === null ? '' : nextValue)}
                          value={value || 'none'}
                        >
                          <SelectTrigger id={`custom-field-${field.key}`}><SelectValue placeholder="Not set" /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="none">Not set</SelectItem>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  const inputType = field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text';
                  const placeholder = field.field_type === 'multiselect' ? 'Comma separated values' : undefined;

                  return (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`custom-field-${field.key}`}>{field.label}</Label>
                      <Input
                        id={`custom-field-${field.key}`}
                        placeholder={placeholder}
                        type={inputType}
                        {...form.register(fieldPath)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}

        <SheetFooter className="border-t pt-4">
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending || form.formState.isSubmitting} form="edit-ticket-details-form" type="submit">
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
