import { useMutation } from '@tanstack/react-query';
import {
  createWorkspaceChecklistItem,
  deleteWorkspaceChecklistItem,
  reorderWorkspaceChecklistItems,
  updateWorkspaceChecklistItem,
} from '@/features/workspace/api/ticketDetailsApi';
import type { ChecklistForm } from '@/features/workspace/pages/ticketDetailsHelpers';
import type { TicketChecklistItem } from '@/types/api';

type UseTicketDetailsChecklistMutationsOptions = {
  workspaceSlug?: string;
  ticketId?: string;
  onAddSuccess: () => void;
  onMutationSuccess: () => void;
};

export function useTicketDetailsChecklistMutations({
  workspaceSlug,
  ticketId,
  onAddSuccess,
  onMutationSuccess,
}: UseTicketDetailsChecklistMutationsOptions) {
  const addChecklistItem = useMutation({
    mutationFn: (values: ChecklistForm) =>
      createWorkspaceChecklistItem(workspaceSlug ?? '', ticketId ?? '', { title: values.title }),
    onSuccess: onAddSuccess,
  });

  const updateChecklistItem = useMutation({
    mutationFn: ({ itemId, values }: { itemId: number; values: Partial<TicketChecklistItem> }) =>
      updateWorkspaceChecklistItem(workspaceSlug ?? '', ticketId ?? '', itemId, values as Record<string, unknown>),
    onSuccess: onMutationSuccess,
  });

  const deleteChecklistItem = useMutation({
    mutationFn: (itemId: number) => deleteWorkspaceChecklistItem(workspaceSlug ?? '', ticketId ?? '', itemId),
    onSuccess: onMutationSuccess,
  });

  const reorderChecklistItems = useMutation({
    mutationFn: (items: Array<{ id: number; sort_order: number }>) =>
      reorderWorkspaceChecklistItems(workspaceSlug ?? '', ticketId ?? '', items),
    onSuccess: onMutationSuccess,
  });

  return {
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    reorderChecklistItems,
  };
}
