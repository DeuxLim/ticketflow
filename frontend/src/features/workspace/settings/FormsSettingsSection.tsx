import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiError } from '@/services/api/client';
import type { TicketCustomFieldConfig } from '@/types/api';
import { FormsSettingsDialogs } from './FormsSettingsDialogs';
import {
  createTicketCustomField,
  createTicketFormTemplate,
  listTicketCustomFields,
  listTicketFormTemplates,
  listTicketTypes,
  updateTicketCustomField,
  updateTicketFormTemplate,
} from '@/features/workspace/api/settings-api';

type FormsSettingsSectionProps = {
  workspaceSlug: string;
};

const fieldTypes: TicketCustomFieldConfig['field_type'][] = ['text', 'textarea', 'number', 'select', 'multiselect', 'checkbox', 'date'];
const anyTypeValue = '__any__';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function FormsSettingsSection({ workspaceSlug }: FormsSettingsSectionProps) {
  const queryClient = useQueryClient();
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<TicketCustomFieldConfig['field_type']>('text');
  const [templateName, setTemplateName] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState(anyTypeValue);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [fieldLabelDraft, setFieldLabelDraft] = useState('');
  const [fieldTypeDraft, setFieldTypeDraft] = useState<TicketCustomFieldConfig['field_type']>('text');
  const [fieldRequiredDraft, setFieldRequiredDraft] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateNameDraft, setTemplateNameDraft] = useState('');
  const [templateTicketTypeDraft, setTemplateTicketTypeDraft] = useState(anyTypeValue);
  const [templateActiveDraft, setTemplateActiveDraft] = useState(true);

  const fieldsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-custom-fields'], queryFn: () => listTicketCustomFields(workspaceSlug) });
  const templatesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-form-templates'], queryFn: () => listTicketFormTemplates(workspaceSlug) });
  const typesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-types'], queryFn: () => listTicketTypes(workspaceSlug) });

  const fields = fieldsQuery.data?.data ?? [];
  const templates = templatesQuery.data?.data ?? [];
  const ticketTypes = typesQuery.data?.data ?? [];

  const createField = useMutation({
    mutationFn: () =>
      createTicketCustomField(workspaceSlug, {
        key: slugify(fieldLabel),
        label: fieldLabel,
        field_type: fieldType,
        is_required: false,
        is_active: true,
      }),
    onSuccess: () => {
      setFieldLabel('');
      setFieldType('text');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-custom-fields'] });
    },
    onError: (error: ApiError) => setFormError(error.message),
  });

  const createTemplate = useMutation({
    mutationFn: () =>
      createTicketFormTemplate(workspaceSlug, {
        name: templateName,
        ticket_type_id: ticketTypeId === anyTypeValue ? null : Number(ticketTypeId),
        field_schema: fields.filter((field) => field.is_active).map((field) => ({ key: field.key, required: field.is_required })),
        is_default: false,
        is_active: true,
      }),
    onSuccess: () => {
      setTemplateName('');
      setTicketTypeId(anyTypeValue);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-form-templates'] });
    },
    onError: (error: ApiError) => setFormError(error.message),
  });

  const updateField = useMutation({
    mutationFn: () =>
      updateTicketCustomField(workspaceSlug, Number(selectedFieldId), {
        label: fieldLabelDraft,
        field_type: fieldTypeDraft,
        is_required: fieldRequiredDraft,
      }),
    onSuccess: () => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-custom-fields'] });
    },
    onError: (error: ApiError) => setFormError(error.message),
  });

  const toggleField = useMutation({
    mutationFn: () => {
      const field = fields.find((item) => String(item.id) === selectedFieldId);
      if (!field) {
        return Promise.reject(new Error('Select a field first.'));
      }
      return updateTicketCustomField(workspaceSlug, field.id, { is_active: !field.is_active });
    },
    onSuccess: () => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-custom-fields'] });
    },
    onError: (error: ApiError) => setFormError(error.message),
  });

  const updateTemplate = useMutation({
    mutationFn: () =>
      updateTicketFormTemplate(workspaceSlug, Number(selectedTemplateId), {
        name: templateNameDraft,
        ticket_type_id: templateTicketTypeDraft === anyTypeValue ? null : Number(templateTicketTypeDraft),
        is_active: templateActiveDraft,
      }),
    onSuccess: () => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-form-templates'] });
    },
    onError: (error: ApiError) => setFormError(error.message),
  });

  function hydrateFieldDrafts(id: string): void {
    const selected = fields.find((field) => String(field.id) === id);
    setFieldLabelDraft(selected?.label ?? '');
    setFieldTypeDraft(selected?.field_type ?? 'text');
    setFieldRequiredDraft(Boolean(selected?.is_required));
    setFormError(null);
  }

  function hydrateTemplateDrafts(id: string): void {
    const selected = templates.find((template) => String(template.id) === id);
    setTemplateNameDraft(selected?.name ?? '');
    setTemplateTicketTypeDraft(selected?.ticket_type_id ? String(selected.ticket_type_id) : anyTypeValue);
    setTemplateActiveDraft(Boolean(selected?.is_active));
    setFormError(null);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Forms
          </Badge>
          <CardTitle>Custom fields</CardTitle>
          <CardDescription>Review reusable fields first, then open the focused manager to create or edit them.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FormsSettingsDialogs
            anyTypeValue={anyTypeValue}
            fieldLabel={fieldLabel}
            fieldLabelDraft={fieldLabelDraft}
            fieldRequiredDraft={fieldRequiredDraft}
            fields={fields}
            fieldType={fieldType}
            fieldTypeDraft={fieldTypeDraft}
            fieldTypes={fieldTypes}
            formError={formError}
            isCreatingField={createField.isPending}
            isCreatingTemplate={createTemplate.isPending}
            isFieldsOpen={isFieldsOpen}
            isSavingField={updateField.isPending || toggleField.isPending}
            isSavingTemplate={updateTemplate.isPending}
            isTemplatesOpen={isTemplatesOpen}
            onCreateField={() => createField.mutate()}
            onCreateTemplate={() => createTemplate.mutate()}
            onSaveField={() => updateField.mutate()}
            onSaveTemplate={() => updateTemplate.mutate()}
            onSelectField={hydrateFieldDrafts}
            onSelectTemplate={hydrateTemplateDrafts}
            onSetFieldsOpen={setIsFieldsOpen}
            onSetTemplatesOpen={setIsTemplatesOpen}
            onToggleField={() => toggleField.mutate()}
            selectedFieldId={selectedFieldId}
            selectedTemplateId={selectedTemplateId}
            section="fields"
            setFieldLabel={setFieldLabel}
            setFieldLabelDraft={setFieldLabelDraft}
            setFieldRequiredDraft={setFieldRequiredDraft}
            setFieldType={setFieldType}
            setFieldTypeDraft={setFieldTypeDraft}
            setSelectedFieldId={setSelectedFieldId}
            setSelectedTemplateId={setSelectedTemplateId}
            setTemplateActiveDraft={setTemplateActiveDraft}
            setTemplateName={setTemplateName}
            setTemplateNameDraft={setTemplateNameDraft}
            setTemplateTicketTypeDraft={setTemplateTicketTypeDraft}
            setTicketTypeId={setTicketTypeId}
            templateActiveDraft={templateActiveDraft}
            templateName={templateName}
            templateNameDraft={templateNameDraft}
            templates={templates}
            templateTicketTypeDraft={templateTicketTypeDraft}
            ticketTypeId={ticketTypeId}
            ticketTypes={ticketTypes}
          />
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Form templates</CardTitle>
          <CardDescription>Review template coverage, then open the focused manager for create and edit work.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FormsSettingsDialogs
            anyTypeValue={anyTypeValue}
            fieldLabel={fieldLabel}
            fieldLabelDraft={fieldLabelDraft}
            fieldRequiredDraft={fieldRequiredDraft}
            fields={fields}
            fieldType={fieldType}
            fieldTypeDraft={fieldTypeDraft}
            fieldTypes={fieldTypes}
            formError={formError}
            isCreatingField={createField.isPending}
            isCreatingTemplate={createTemplate.isPending}
            isFieldsOpen={isFieldsOpen}
            isSavingField={updateField.isPending || toggleField.isPending}
            isSavingTemplate={updateTemplate.isPending}
            isTemplatesOpen={isTemplatesOpen}
            onCreateField={() => createField.mutate()}
            onCreateTemplate={() => createTemplate.mutate()}
            onSaveField={() => updateField.mutate()}
            onSaveTemplate={() => updateTemplate.mutate()}
            onSelectField={hydrateFieldDrafts}
            onSelectTemplate={hydrateTemplateDrafts}
            onSetFieldsOpen={setIsFieldsOpen}
            onSetTemplatesOpen={setIsTemplatesOpen}
            onToggleField={() => toggleField.mutate()}
            selectedFieldId={selectedFieldId}
            selectedTemplateId={selectedTemplateId}
            section="templates"
            setFieldLabel={setFieldLabel}
            setFieldLabelDraft={setFieldLabelDraft}
            setFieldRequiredDraft={setFieldRequiredDraft}
            setFieldType={setFieldType}
            setFieldTypeDraft={setFieldTypeDraft}
            setSelectedFieldId={setSelectedFieldId}
            setSelectedTemplateId={setSelectedTemplateId}
            setTemplateActiveDraft={setTemplateActiveDraft}
            setTemplateName={setTemplateName}
            setTemplateNameDraft={setTemplateNameDraft}
            setTemplateTicketTypeDraft={setTemplateTicketTypeDraft}
            setTicketTypeId={setTicketTypeId}
            templateActiveDraft={templateActiveDraft}
            templateName={templateName}
            templateNameDraft={templateNameDraft}
            templates={templates}
            templateTicketTypeDraft={templateTicketTypeDraft}
            ticketTypeId={ticketTypeId}
            ticketTypes={ticketTypes}
          />
        </CardContent>
      </Card>
    </div>
  );
}
