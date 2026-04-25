import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/services/api/client';
import type { TicketCustomFieldConfig, TicketFormTemplateConfig } from '@/types/api';

export const ticketFormSchema = z.object({
  customer_id: z.string().min(1, 'Select a customer'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to_user_id: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  queue_key: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  custom_fields: z.record(z.string(), z.string()).optional(),
});

export type TicketForm = z.infer<typeof ticketFormSchema>;

export const ticketFormDefaultValues: TicketForm = {
  customer_id: '',
  title: '',
  description: '',
  status: 'open',
  priority: 'medium',
  assigned_to_user_id: '',
  category: '',
  queue_key: '',
  tags: '',
  custom_fields: {},
};

export function applyTicketFormFieldErrors(form: UseFormReturn<TicketForm>, error: unknown) {
  if (!(error instanceof ApiError)) {
    return;
  }

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (!messages.length) continue;

    if (
      field === 'customer_id' ||
      field === 'title' ||
      field === 'description' ||
      field === 'status' ||
      field === 'priority' ||
      field === 'assigned_to_user_id' ||
      field === 'category' ||
      field === 'queue_key' ||
      field === 'tags'
    ) {
      form.setError(field, { type: 'server', message: messages[0] });
    }
  }
}

export function parseTicketTags(value: string | undefined): string[] | null {
  if (!value) {
    return null;
  }

  const parsed = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : null;
}

export function customFieldOptions(field: TicketCustomFieldConfig): string[] {
  return field.options
    .map((option) => (typeof option === 'string' ? option : null))
    .filter((option): option is string => option !== null);
}

export function buildCustomFieldPayload(
  values: Record<string, string> | undefined,
  fieldConfigs: TicketCustomFieldConfig[],
): Record<string, unknown> {
  if (!values) {
    return {};
  }

  return fieldConfigs.reduce<Record<string, unknown>>((payload, field) => {
    const rawValue = values[field.key];
    if (rawValue === undefined || rawValue === '') {
      return payload;
    }

    if (field.field_type === 'number') {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) {
        payload[field.key] = parsed;
      }
      return payload;
    }

    if (field.field_type === 'checkbox') {
      payload[field.key] = rawValue === 'true';
      return payload;
    }

    if (field.field_type === 'multiselect') {
      payload[field.key] = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      return payload;
    }

    payload[field.key] = rawValue;
    return payload;
  }, {});
}

function templateFieldKeys(template: TicketFormTemplateConfig | null): Set<string> | null {
  if (!template) {
    return null;
  }

  const keys = template.field_schema
    .map((entry) => (typeof entry.key === 'string' ? entry.key : null))
    .filter((key): key is string => key !== null && key.length > 0);

  return keys.length > 0 ? new Set(keys) : new Set<string>();
}

export function filterCustomFieldsByTemplate(
  fields: TicketCustomFieldConfig[],
  template: TicketFormTemplateConfig | null,
): TicketCustomFieldConfig[] {
  const keys = templateFieldKeys(template);
  if (keys === null) {
    return fields;
  }

  return fields.filter((field) => keys.has(field.key));
}
