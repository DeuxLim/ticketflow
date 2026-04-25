import type { UseFormReturn } from 'react-hook-form';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  customFieldOptions,
  type TicketForm,
} from '@/features/workspace/pages/ticketForm';
import type {
  Customer,
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

type TicketFormFieldsProps = {
  form: UseFormReturn<TicketForm>;
  customers: Customer[];
  members: MemberOption[];
  activeQueues: TicketQueueConfig[];
  activeCategories: TicketCategoryConfig[];
  activeTags: TicketTagConfig[];
  activeCustomFields: TicketCustomFieldConfig[];
  templates: TicketFormTemplateConfig[];
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  onSubmit: (values: TicketForm) => void;
  formId: string;
};

export function TicketFormFields({
  form,
  customers,
  members,
  activeQueues,
  activeCategories,
  activeTags,
  activeCustomFields,
  templates,
  selectedTemplateId,
  onTemplateChange,
  onSubmit,
  formId,
}: TicketFormFieldsProps) {
  const queueValue = form.watch('queue_key') || 'none';
  const categoryValue = form.watch('category') || 'none';
  const hasLegacyQueueValue = queueValue !== 'none' && !activeQueues.some((queue) => queue.key === queueValue);
  const hasLegacyCategoryValue = categoryValue !== 'none' && !activeCategories.some((category) => category.key === categoryValue);

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field data-invalid={Boolean(form.formState.errors.customer_id)}>
          <FieldLabel htmlFor={`${formId}-customer`}>Customer</FieldLabel>
          <Select
            onValueChange={(value) => form.setValue('customer_id', value ?? '', { shouldValidate: true })}
            value={form.watch('customer_id')}
          >
            <SelectTrigger id={`${formId}-customer`} aria-invalid={Boolean(form.formState.errors.customer_id)}>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
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
          <FieldError errors={[form.formState.errors.customer_id]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-template`}>Form Template</FieldLabel>
          <Select
            onValueChange={(value) => onTemplateChange(value ?? 'none')}
            value={selectedTemplateId}
          >
            <SelectTrigger id={`${formId}-template`}><SelectValue placeholder="All active fields" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">All active fields</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={String(template.id)}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-assignee`}>Assignee</FieldLabel>
          <Select
            onValueChange={(value) => form.setValue('assigned_to_user_id', value === 'none' || value === null ? '' : value)}
            value={form.watch('assigned_to_user_id') || 'none'}
          >
            <SelectTrigger id={`${formId}-assignee`}><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">Unassigned</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.user.id} value={String(member.user.id)}>
                    {member.user.first_name} {member.user.last_name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.title)}>
          <FieldLabel htmlFor={`${formId}-title`}>Title</FieldLabel>
          <Input id={`${formId}-title`} aria-invalid={Boolean(form.formState.errors.title)} {...form.register('title')} />
          <FieldError errors={[form.formState.errors.title]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-status`}>Status</FieldLabel>
          <Select
            onValueChange={(value) => form.setValue('status', value as TicketForm['status'])}
            value={form.watch('status')}
          >
            <SelectTrigger id={`${formId}-status`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-queue`}>Queue</FieldLabel>
          <Select
            onValueChange={(value) => form.setValue('queue_key', value === 'none' || value === null ? '' : value)}
            value={queueValue}
          >
            <SelectTrigger id={`${formId}-queue`}><SelectValue placeholder="Default queue" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">Default queue</SelectItem>
                {activeQueues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.key}>
                    {queue.name}
                  </SelectItem>
                ))}
                {hasLegacyQueueValue && <SelectItem value={queueValue}>{queueValue} (legacy)</SelectItem>}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-category`}>Category</FieldLabel>
          <Select
            onValueChange={(value) => form.setValue('category', value === 'none' || value === null ? '' : value)}
            value={categoryValue}
          >
            <SelectTrigger id={`${formId}-category`}><SelectValue placeholder="No category" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">No category</SelectItem>
                {activeCategories.map((category) => (
                  <SelectItem key={category.id} value={category.key}>
                    {category.name}
                  </SelectItem>
                ))}
                {hasLegacyCategoryValue && <SelectItem value={categoryValue}>{categoryValue} (legacy)</SelectItem>}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.description)} className="md:col-span-2">
          <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
          <Textarea id={`${formId}-description`} aria-invalid={Boolean(form.formState.errors.description)} {...form.register('description')} />
          <FieldError errors={[form.formState.errors.description]} />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`${formId}-priority`}>Priority</FieldLabel>
          <Select
            onValueChange={(value) => form.setValue('priority', value as TicketForm['priority'])}
            value={form.watch('priority')}
          >
            <SelectTrigger id={`${formId}-priority`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`${formId}-tags`}>Tags (comma separated)</FieldLabel>
          <Input id={`${formId}-tags`} list={`${formId}-tag-options`} placeholder="network, vpn" {...form.register('tags')} />
          {activeTags.length > 0 && (
            <>
              <datalist id={`${formId}-tag-options`}>
                {activeTags.map((tag) => (
                  <option key={tag.id} value={tag.name} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">Available tags: {activeTags.map((tag) => tag.name).join(', ')}</p>
            </>
          )}
        </Field>

        {activeCustomFields.length > 0 && (
          <div className="space-y-3 md:col-span-2">
            <p className="text-sm font-medium">Custom Fields</p>
            <div className="grid gap-3 md:grid-cols-2">
              {activeCustomFields.map((field) => {
                const fieldPath = `custom_fields.${field.key}` as const;

                if (field.field_type === 'textarea') {
                  return (
                    <Field key={field.id} className="md:col-span-2">
                      <FieldLabel htmlFor={`${formId}-custom-${field.key}`}>{field.label}</FieldLabel>
                      <Textarea id={`${formId}-custom-${field.key}`} {...form.register(fieldPath)} />
                    </Field>
                  );
                }

                if (field.field_type === 'select') {
                  const options = customFieldOptions(field);
                  const currentValue = form.watch(fieldPath) ?? '';

                  return (
                    <Field key={field.id}>
                      <FieldLabel htmlFor={`${formId}-custom-${field.key}`}>{field.label}</FieldLabel>
                      <Select
                        onValueChange={(value) => form.setValue(fieldPath, value === 'none' || value === null ? '' : value)}
                        value={currentValue || 'none'}
                      >
                        <SelectTrigger id={`${formId}-custom-${field.key}`}><SelectValue placeholder="Not set" /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="none">Not set</SelectItem>
                            {options.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  );
                }

                if (field.field_type === 'checkbox') {
                  const currentValue = form.watch(fieldPath) ?? '';

                  return (
                    <Field key={field.id}>
                      <FieldLabel htmlFor={`${formId}-custom-${field.key}`}>{field.label}</FieldLabel>
                      <Select
                        onValueChange={(value) => form.setValue(fieldPath, value === 'none' || value === null ? '' : value)}
                        value={currentValue || 'none'}
                      >
                        <SelectTrigger id={`${formId}-custom-${field.key}`}><SelectValue placeholder="Not set" /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="none">Not set</SelectItem>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  );
                }

                const inputType = field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text';
                const placeholder = field.field_type === 'multiselect' ? 'Comma separated values' : undefined;

                return (
                  <Field key={field.id}>
                    <FieldLabel htmlFor={`${formId}-custom-${field.key}`}>{field.label}</FieldLabel>
                    <Input
                      id={`${formId}-custom-${field.key}`}
                      placeholder={placeholder}
                      type={inputType}
                      {...form.register(fieldPath)}
                    />
                  </Field>
                );
              })}
            </div>
          </div>
        )}
      </FieldGroup>
    </form>
  );
}
