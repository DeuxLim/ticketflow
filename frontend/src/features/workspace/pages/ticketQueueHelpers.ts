import type { SavedViewRecord, Ticket } from '@/types/api';
import { ticketFormDefaultValues, type TicketForm } from '@/features/workspace/pages/ticketForm';

export function createTicketFormDefaults(): TicketForm {
  return {
    ...ticketFormDefaultValues,
    custom_fields: {},
  };
}

export function buildEditTicketFormValues(ticket: Ticket): TicketForm {
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
    custom_fields: Object.fromEntries(
      (ticket.custom_fields ?? []).map((field) => [
        field.key ?? String(field.ticket_custom_field_id),
        field.value === null || field.value === undefined
          ? ''
          : Array.isArray(field.value)
            ? field.value.join(', ')
            : String(field.value),
      ]),
    ),
  };
}

export function countActiveTicketFilters(search: string, filters: string[]): number {
  return filters.filter((value) => value !== 'all').length + (search.trim().length > 0 ? 1 : 0);
}

export function findSavedViewName(savedViews: SavedViewRecord[], selectedSavedViewId: string): string | null {
  if (selectedSavedViewId === 'none') {
    return null;
  }

  return savedViews.find((view) => String(view.id) === selectedSavedViewId)?.name ?? 'Custom';
}
