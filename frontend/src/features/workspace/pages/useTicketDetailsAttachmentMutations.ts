import { useMutation } from '@tanstack/react-query';
import {
  deleteWorkspaceTicketAttachment,
  uploadWorkspaceTicketAttachment,
} from '@/features/workspace/api/ticketDetailsApi';

type UseTicketDetailsAttachmentMutationsOptions = {
  workspaceSlug?: string;
  ticketId?: string;
  attachmentFile: File | null;
  onUploadSuccess: () => void;
  onDeleteSuccess: () => void;
};

export function useTicketDetailsAttachmentMutations({
  workspaceSlug,
  ticketId,
  attachmentFile,
  onUploadSuccess,
  onDeleteSuccess,
}: UseTicketDetailsAttachmentMutationsOptions) {
  const uploadAttachment = useMutation({
    mutationFn: () => {
      if (!attachmentFile) throw new Error('Please select a file first.');

      const formData = new FormData();
      formData.append('file', attachmentFile);

      return uploadWorkspaceTicketAttachment(workspaceSlug ?? '', ticketId ?? '', formData);
    },
    onSuccess: onUploadSuccess,
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: number) =>
      deleteWorkspaceTicketAttachment(workspaceSlug ?? '', ticketId ?? '', attachmentId),
    onSuccess: onDeleteSuccess,
  });

  return {
    uploadAttachment,
    deleteAttachment,
  };
}
