import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { selectorCoverageHint } from '@/features/workspace/utils/selectorCoverage';
import { filterCustomFieldsByTemplate, type TicketForm } from '@/features/workspace/pages/ticketForm';
import type { ActivityLog, RelatedTicketForm, TicketDetailsAttachment } from '@/features/workspace/pages/ticketDetailsHelpers';
import type {
  ApiPaginationMeta,
  Customer,
  Ticket,
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

type ListResponse<T> = {
  data?: T[];
  meta?: ApiPaginationMeta | Record<string, unknown>;
};

type UseTicketDetailsDerivedStateOptions = {
  ticket?: Ticket;
  ticketId?: string;
  customersResponse?: ListResponse<Customer>;
  membersResponse?: ListResponse<MemberOption>;
  queueConfigsResponse?: ListResponse<TicketQueueConfig>;
  categoryConfigsResponse?: ListResponse<TicketCategoryConfig>;
  tagConfigsResponse?: ListResponse<TicketTagConfig>;
  customFieldConfigsResponse?: ListResponse<TicketCustomFieldConfig>;
  templateConfigsResponse?: ListResponse<TicketFormTemplateConfig>;
  relatedTicketOptionsResponse?: ListResponse<Ticket>;
  attachmentsResponse?: ListResponse<TicketDetailsAttachment>;
  activityResponse?: ListResponse<ActivityLog>;
  currentUserId?: number;
  editForm: UseFormReturn<TicketForm>;
  relatedTicketForm: UseFormReturn<RelatedTicketForm>;
  editTemplateId: string;
};

export function useTicketDetailsDerivedState({
  ticket,
  ticketId,
  customersResponse,
  membersResponse,
  queueConfigsResponse,
  categoryConfigsResponse,
  tagConfigsResponse,
  customFieldConfigsResponse,
  templateConfigsResponse,
  relatedTicketOptionsResponse,
  attachmentsResponse,
  activityResponse,
  currentUserId,
  editForm,
  relatedTicketForm,
  editTemplateId,
}: UseTicketDetailsDerivedStateOptions) {
  const editCustomerIdValue = useWatch({ control: editForm.control, name: 'customer_id' });
  const editAssigneeIdValue = useWatch({ control: editForm.control, name: 'assigned_to_user_id' });
  const editStatusValue = useWatch({ control: editForm.control, name: 'status' });
  const editPriorityValue = useWatch({ control: editForm.control, name: 'priority' });
  const editCustomFieldsValue = useWatch({ control: editForm.control, name: 'custom_fields' });
  const relatedTicketIdValue = useWatch({ control: relatedTicketForm.control, name: 'related_ticket_id' });
  const relatedTicketRelationshipValue = useWatch({ control: relatedTicketForm.control, name: 'relationship_type' });

  const customers = customersResponse?.data ?? [];
  const customersMeta = customersResponse?.meta;
  const members = membersResponse?.data ?? [];
  const activeQueueConfigs = (queueConfigsResponse?.data ?? [])
    .filter((queue) => queue.is_active)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  const activeCategoryConfigs = (categoryConfigsResponse?.data ?? [])
    .filter((category) => category.is_active)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  const activeTagConfigs = (tagConfigsResponse?.data ?? [])
    .filter((tag) => tag.is_active)
    .sort((left, right) => left.name.localeCompare(right.name));
  const activeCustomFieldConfigs = (customFieldConfigsResponse?.data ?? [])
    .filter((field) => field.is_active)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  const activeTemplateConfigs = (templateConfigsResponse?.data ?? [])
    .filter((template) => template.is_active)
    .sort((left, right) => Number(right.is_default) - Number(left.is_default) || left.id - right.id);
  const defaultTemplateId = activeTemplateConfigs.length > 0 ? String(activeTemplateConfigs[0].id) : 'none';
  const effectiveEditTemplateId = editTemplateId === 'none' && defaultTemplateId !== 'none' ? defaultTemplateId : editTemplateId;
  const selectedTemplate = activeTemplateConfigs.find((template) => String(template.id) === effectiveEditTemplateId) ?? null;
  const scopedCustomFieldConfigs = filterCustomFieldsByTemplate(activeCustomFieldConfigs, selectedTemplate);
  const relatedTicketOptions = (relatedTicketOptionsResponse?.data ?? []).filter((option) => String(option.id) !== ticketId);
  const relatedTicketsMeta = relatedTicketOptionsResponse?.meta;
  const relatedTicketsCoverageHint = selectorCoverageHint(relatedTicketOptions.length, paginationTotal(relatedTicketsMeta), 'tickets');
  const customersCoverageHint = selectorCoverageHint(customers.length, paginationTotal(customersMeta), 'customers');
  const attachments = useMemo(() => attachmentsResponse?.data ?? [], [attachmentsResponse?.data]);
  const activityLogs = useMemo(() => activityResponse?.data ?? [], [activityResponse?.data]);
  const watchers = ticket?.watchers ?? [];
  const checklistItems = ticket?.checklist_items ?? [];
  const relatedTickets = ticket?.related_tickets ?? [];
  const customFields = ticket?.custom_fields ?? [];
  const ticketLevelAttachments = attachments.filter((attachment) => attachment.comment_id === null);
  const selfWatcher = watchers.find((watcher) => watcher.user_id === currentUserId);
  const editQueueValue = useWatch({ control: editForm.control, name: 'queue_key' }) || 'none';
  const editCategoryValue = useWatch({ control: editForm.control, name: 'category' }) || 'none';
  const hasLegacyEditQueueValue = editQueueValue !== 'none' && !activeQueueConfigs.some((queue) => queue.key === editQueueValue);
  const hasLegacyEditCategoryValue = editCategoryValue !== 'none' && !activeCategoryConfigs.some((category) => category.key === editCategoryValue);
  const attachmentsByComment = useMemo(() => {
    return attachments.reduce<Record<number, TicketDetailsAttachment[]>>((acc, attachment) => {
      if (attachment.comment_id === null) {
        return acc;
      }

      if (!acc[attachment.comment_id]) {
        acc[attachment.comment_id] = [];
      }

      acc[attachment.comment_id].push(attachment);
      return acc;
    }, {});
  }, [attachments]);
  const slaSignals = useMemo(() => buildSlaSignals(ticket), [ticket]);

  return {
    customers,
    members,
    activeQueueConfigs,
    activeCategoryConfigs,
    activeTagConfigs,
    activeCustomFieldConfigs,
    activeTemplateConfigs,
    defaultTemplateId,
    effectiveEditTemplateId,
    scopedCustomFieldConfigs,
    relatedTicketOptions,
    relatedTicketsCoverageHint,
    customersCoverageHint,
    attachments,
    activityLogs,
    watchers,
    checklistItems,
    relatedTickets,
    customFields,
    ticketLevelAttachments,
    selfWatcher,
    editCustomerIdValue,
    editAssigneeIdValue,
    editStatusValue,
    editPriorityValue,
    editCustomFieldsValue,
    relatedTicketIdValue,
    relatedTicketRelationshipValue,
    editQueueValue,
    editCategoryValue,
    hasLegacyEditQueueValue,
    hasLegacyEditCategoryValue,
    attachmentsByComment,
    slaSignals,
  };
}

function paginationTotal(meta: ApiPaginationMeta | Record<string, unknown> | undefined): number | undefined {
  return typeof meta?.total === 'number' ? meta.total : undefined;
}

function buildSlaSignals(ticket?: Ticket) {
  if (!ticket) return [] as Array<{ key: string; label: string; time: string | null; severity: 'warning' | 'info' }>;

  const now = new Date();
  const signals: Array<{ key: string; label: string; time: string | null; severity: 'warning' | 'info' }> = [];

  if (ticket.first_response_due_at && !ticket.first_responded_at && new Date(ticket.first_response_due_at) < now) {
    signals.push({
      key: 'first-response-breach',
      label: 'First response SLA breached',
      time: ticket.first_response_due_at,
      severity: 'warning',
    });
  }

  if (ticket.resolution_due_at && !ticket.resolved_at && new Date(ticket.resolution_due_at) < now) {
    signals.push({
      key: 'resolution-breach',
      label: 'Resolution SLA breached',
      time: ticket.resolution_due_at,
      severity: 'warning',
    });
  }

  if (signals.length === 0) {
    signals.push({
      key: 'sla-healthy',
      label: 'No active SLA breaches',
      time: null,
      severity: 'info',
    });
  }

  return signals;
}
