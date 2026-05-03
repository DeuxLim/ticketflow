import { z } from 'zod';
import type { Ticket, TicketCustomFieldConfig } from '@/types/api';
import { ticketFormDefaultValues, type TicketForm } from '@/features/workspace/pages/ticketForm';

export const commentSchema = z.object({
  body: z.string().min(2, 'Comment must not be empty'),
  is_internal: z.boolean(),
});

export const checklistSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
});

export const relatedTicketSchema = z.object({
  related_ticket_id: z.string().min(1, 'Select a ticket'),
  relationship_type: z.string().min(2, 'Relationship is required'),
});

export type CommentForm = z.infer<typeof commentSchema>;
export type ChecklistForm = z.infer<typeof checklistSchema>;
export type RelatedTicketForm = z.infer<typeof relatedTicketSchema>;

export type ActivityLog = {
  id: number;
  action: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  meta?: Record<string, unknown> | null;
};

export type TicketDetailsAttachment = {
  id: number;
  ticket_id: number;
  comment_id: number | null;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  uploader?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at: string;
};

export function createTicketDetailsFormDefaults(): TicketForm {
  return {
    ...ticketFormDefaultValues,
    custom_fields: {},
  };
}

export function buildTicketDetailsFormValues(
  ticket: Ticket,
  activeCustomFieldConfigs: TicketCustomFieldConfig[],
): TicketForm {
  const persistedCustomFields = Object.fromEntries(
    (ticket.custom_fields ?? []).map((field) => [
      field.key ?? String(field.ticket_custom_field_id),
      field.value === null || field.value === undefined
        ? ''
        : Array.isArray(field.value)
          ? field.value.join(', ')
          : String(field.value),
    ]),
  );

  for (const config of activeCustomFieldConfigs) {
    if (!(config.key in persistedCustomFields)) {
      persistedCustomFields[config.key] = '';
    }
  }

  return {
    customer_id: String(ticket.customer_id),
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    assigned_to_user_id: ticket.assigned_to_user_id ? String(ticket.assigned_to_user_id) : '',
    category: ticket.category ?? '',
    queue_key: ticket.queue_key ?? '',
    tags: (ticket.tags ?? []).join(', '),
    custom_fields: persistedCustomFields,
  };
}

export function formatTicketDetailsDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function bytesToReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function statusLabel(value?: string | null): string {
  return value
    ? value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (match) => match.toUpperCase())
    : '—';
}

export function mutationErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Action failed. Please try again.';
}
