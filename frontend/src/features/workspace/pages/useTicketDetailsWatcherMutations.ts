import { useMutation } from '@tanstack/react-query';
import {
  addWorkspaceTicketWatcher,
  removeWorkspaceTicketWatcher,
} from '@/features/workspace/api/ticketDetailsApi';

type UseTicketDetailsWatcherMutationsOptions = {
  workspaceSlug?: string;
  ticketId?: string;
  onSuccess: () => void;
};

export function useTicketDetailsWatcherMutations({
  workspaceSlug,
  ticketId,
  onSuccess,
}: UseTicketDetailsWatcherMutationsOptions) {
  const addWatcher = useMutation({
    mutationFn: () => addWorkspaceTicketWatcher(workspaceSlug ?? '', ticketId ?? ''),
    onSuccess,
  });

  const removeWatcher = useMutation({
    mutationFn: (watcherId: number) => removeWorkspaceTicketWatcher(workspaceSlug ?? '', ticketId ?? '', watcherId),
    onSuccess,
  });

  return {
    addWatcher,
    removeWatcher,
  };
}
