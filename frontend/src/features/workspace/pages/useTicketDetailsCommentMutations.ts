import { useMutation } from '@tanstack/react-query';
import {
  createWorkspaceTicketComment,
  deleteWorkspaceTicketComment,
  updateWorkspaceTicketComment,
  uploadWorkspaceTicketAttachment,
} from '@/features/workspace/api/ticketDetailsApi';
import type { CommentForm } from '@/features/workspace/pages/ticketDetailsHelpers';
import type { TicketComment } from '@/types/api';

type UseTicketDetailsCommentMutationsOptions = {
  workspaceSlug?: string;
  ticketId?: string;
  commentFiles: File[];
  onAddSuccess: () => void;
  onUpdateSuccess: () => void;
  onDeleteSuccess: () => void;
};

export function useTicketDetailsCommentMutations({
  workspaceSlug,
  ticketId,
  commentFiles,
  onAddSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: UseTicketDetailsCommentMutationsOptions) {
  const addComment = useMutation({
    mutationFn: async (values: CommentForm) => {
      const response = await createWorkspaceTicketComment(workspaceSlug ?? '', ticketId ?? '', values) as { data: TicketComment };
      const commentId = response.data.id;

      for (const file of commentFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('comment_id', String(commentId));

        await uploadWorkspaceTicketAttachment(workspaceSlug ?? '', ticketId ?? '', formData);
      }

      return response;
    },
    onSuccess: onAddSuccess,
  });

  const updateComment = useMutation({
    mutationFn: ({ commentId, body }: { commentId: number; body: string }) =>
      updateWorkspaceTicketComment(workspaceSlug ?? '', ticketId ?? '', commentId, { body }),
    onSuccess: onUpdateSuccess,
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: number) =>
      deleteWorkspaceTicketComment(workspaceSlug ?? '', ticketId ?? '', commentId),
    onSuccess: onDeleteSuccess,
  });

  return {
    addComment,
    updateComment,
    deleteComment,
  };
}
