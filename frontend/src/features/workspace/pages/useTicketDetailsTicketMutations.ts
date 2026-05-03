import { useMutation } from '@tanstack/react-query';
import {
  deleteWorkspaceTicket,
  transitionWorkspaceTicket,
  updateWorkspaceTicket,
} from '@/features/workspace/api/ticketDetailsApi';
import {
  buildCustomFieldPayload,
  parseTicketTags,
  type TicketForm,
} from '@/features/workspace/pages/ticketForm';
import { ApiError } from '@/services/api/client';
import type { Ticket, TicketCustomFieldConfig } from '@/types/api';

type UseTicketDetailsTicketMutationsOptions = {
  workspaceSlug?: string;
  ticketId?: string;
  scopedCustomFieldConfigs: TicketCustomFieldConfig[];
  onUpdateSuccess: () => void;
  onUpdateError: (error: unknown) => void;
  onTransitionSuccess: (payload: unknown) => void;
  onDeleteSuccess: () => void;
};

export function useTicketDetailsTicketMutations({
  workspaceSlug,
  ticketId,
  scopedCustomFieldConfigs,
  onUpdateSuccess,
  onUpdateError,
  onTransitionSuccess,
  onDeleteSuccess,
}: UseTicketDetailsTicketMutationsOptions) {
  const updateTicket = useMutation({
    mutationFn: (values: TicketForm) =>
      updateWorkspaceTicket(workspaceSlug ?? '', ticketId ?? '', {
        customer_id: Number(values.customer_id),
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigned_to_user_id: values.assigned_to_user_id ? Number(values.assigned_to_user_id) : null,
        category: values.category || null,
        queue_key: values.queue_key || null,
        tags: parseTicketTags(values.tags),
        custom_fields: buildCustomFieldPayload(values.custom_fields, scopedCustomFieldConfigs),
      }),
    onSuccess: onUpdateSuccess,
    onError: onUpdateError,
  });

  const quickTransition = useMutation({
    mutationFn: async (status: Ticket['status']) => {
      try {
        return await transitionWorkspaceTicket(workspaceSlug ?? '', ticketId ?? '', status);
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          return updateWorkspaceTicket(workspaceSlug ?? '', ticketId ?? '', { status }) as Promise<{ data: Ticket }>;
        }

        throw error;
      }
    },
    onSuccess: onTransitionSuccess,
  });

  const quickAssign = useMutation({
    mutationFn: (assigneeId: number | null) =>
      updateWorkspaceTicket(workspaceSlug ?? '', ticketId ?? '', {
        assigned_to_user_id: assigneeId,
      }),
    onSuccess: onUpdateSuccess,
  });

  const deleteTicket = useMutation({
    mutationFn: () => deleteWorkspaceTicket(workspaceSlug ?? '', ticketId ?? ''),
    onSuccess: onDeleteSuccess,
  });

  return {
    updateTicket,
    quickTransition,
    quickAssign,
    deleteTicket,
  };
}
