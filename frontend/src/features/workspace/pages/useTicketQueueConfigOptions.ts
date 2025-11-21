import { useMemo } from 'react';
import { filterCustomFieldsByTemplate } from './ticketForm';
import type {
  TicketCategoryConfig,
  TicketCustomFieldConfig,
  TicketFormTemplateConfig,
  TicketQueueConfig,
  TicketTagConfig,
} from '@/types/api';

export function useTicketQueueConfigOptions({
  categoryConfigs,
  createTemplateId,
  customFieldConfigs,
  editTemplateId,
  queueConfigs,
  tagConfigs,
  templateConfigs,
}: {
  categoryConfigs: TicketCategoryConfig[];
  createTemplateId: string;
  customFieldConfigs: TicketCustomFieldConfig[];
  editTemplateId: string;
  queueConfigs: TicketQueueConfig[];
  tagConfigs: TicketTagConfig[];
  templateConfigs: TicketFormTemplateConfig[];
}) {
  const activeQueueConfigs = useMemo(
    () =>
      queueConfigs
        .filter((queue) => queue.is_active)
        .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id),
    [queueConfigs],
  );

  const activeCategoryConfigs = useMemo(
    () =>
      categoryConfigs
        .filter((category) => category.is_active)
        .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id),
    [categoryConfigs],
  );

  const activeTagConfigs = useMemo(
    () =>
      tagConfigs
        .filter((tag) => tag.is_active)
        .sort((left, right) => left.name.localeCompare(right.name)),
    [tagConfigs],
  );

  const activeCustomFieldConfigs = useMemo(
    () =>
      customFieldConfigs
        .filter((field) => field.is_active)
        .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id),
    [customFieldConfigs],
  );

  const activeTemplateConfigs = useMemo(
    () =>
      templateConfigs
        .filter((template) => template.is_active)
        .sort((left, right) => Number(right.is_default) - Number(left.is_default) || left.id - right.id),
    [templateConfigs],
  );

  const defaultTemplateId = activeTemplateConfigs.length > 0 ? String(activeTemplateConfigs[0].id) : 'none';
  const createSelectedTemplate = activeTemplateConfigs.find((template) => String(template.id) === createTemplateId) ?? null;
  const editSelectedTemplate = activeTemplateConfigs.find((template) => String(template.id) === editTemplateId) ?? null;
  const createTemplateFields = filterCustomFieldsByTemplate(activeCustomFieldConfigs, createSelectedTemplate);
  const editTemplateFields = filterCustomFieldsByTemplate(activeCustomFieldConfigs, editSelectedTemplate);

  return {
    activeCategoryConfigs,
    activeCustomFieldConfigs,
    activeQueueConfigs,
    activeTagConfigs,
    activeTemplateConfigs,
    createTemplateFields,
    defaultTemplateId,
    editTemplateFields,
  };
}
