import { useMutation } from '@tanstack/react-query';
import {
  createWorkspaceRelatedTicket,
  deleteWorkspaceRelatedTicket,
} from '@/features/workspace/api/ticketDetailsApi';
import type { RelatedTicketForm } from '@/features/workspace/pages/ticketDetailsHelpers';

type UseTicketDetailsRelatedTicketMutationsOptions = {
  workspaceSlug?: string;
  ticketId?: string;
  onAddSuccess: () => void;
  onDeleteSuccess: () => void;
};

export function useTicketDetailsRelatedTicketMutations({
  workspaceSlug,
  ticketId,
  onAddSuccess,
  onDeleteSuccess,
}: UseTicketDetailsRelatedTicketMutationsOptions) {
  const addRelatedTicket = useMutation({
    mutationFn: (values: RelatedTicketForm) =>
      createWorkspaceRelatedTicket(workspaceSlug ?? '', ticketId ?? '', {
        related_ticket_id: Number(values.related_ticket_id),
        relationship_type: values.relationship_type,
      }),
    onSuccess: onAddSuccess,
  });

  const deleteRelatedTicket = useMutation({
    mutationFn: (linkId: number) => deleteWorkspaceRelatedTicket(workspaceSlug ?? '', ticketId ?? '', linkId),
    onSuccess: onDeleteSuccess,
  });

  return {
    addRelatedTicket,
    deleteRelatedTicket,
  };
}
