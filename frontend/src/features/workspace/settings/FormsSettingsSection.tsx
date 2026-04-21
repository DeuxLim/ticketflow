import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApiError } from '@/services/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TicketCustomFieldConfig } from '@/types/api';
import {
  createTicketCustomField,
  createTicketFormTemplate,
  listTicketCustomFields,
  listTicketFormTemplates,
  listTicketTypes,
  updateTicketCustomField,
  updateTicketFormTemplate,
} from './settings-api';

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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Field dictionary</p>
              <p className="mt-1 text-xs text-muted-foreground">{fields.length} fields configured for dynamic ticket intake.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setIsFieldsOpen(true)}>
              Manage fields
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell>{field.label}</TableCell>
                    <TableCell>{field.key}</TableCell>
                    <TableCell>{field.field_type}</TableCell>
                    <TableCell>
                      <Badge variant={field.is_active ? 'secondary' : 'outline'}>{field.is_active ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Form templates</CardTitle>
          <CardDescription>Review template coverage, then open the focused manager for create and edit work.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Template library</p>
              <p className="mt-1 text-xs text-muted-foreground">{templates.length} templates map ticket types to dynamic fields.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setIsTemplatesOpen(true)}>
              Manage templates
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{template.ticket_type?.name ?? 'Any type'}</TableCell>
                    <TableCell>{template.field_schema.length}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'secondary' : 'outline'}>{template.is_active ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFieldsOpen} onOpenChange={setIsFieldsOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Custom Fields</DialogTitle>
            <DialogDescription>Create and update dynamic fields without crowding the settings overview.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <form
              className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                createField.mutate();
              }}
            >
              <FieldGroup className="contents">
                <Field>
                  <FieldLabel htmlFor="custom-field-label">Field label</FieldLabel>
                  <Input id="custom-field-label" value={fieldLabel} onChange={(event) => setFieldLabel(event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <Select value={fieldType} onValueChange={(value) => setFieldType(value as TicketCustomFieldConfig['field_type'])}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <Button type="submit" className="self-end" disabled={!fieldLabel || createField.isPending}>
                Add field
              </Button>
            </form>

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Edit field</h3>
                <Badge variant="outline">{fields.length} records</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-[180px_1fr_180px_120px_auto_auto]">
                <Select
                  value={selectedFieldId}
                  onValueChange={(value) => {
                    const selected = value ?? '';
                    setSelectedFieldId(selected);
                    hydrateFieldDrafts(selected);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={String(field.id)}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Input aria-label="Field label draft" value={fieldLabelDraft} onChange={(event) => setFieldLabelDraft(event.target.value)} />
                <Select value={fieldTypeDraft} onValueChange={(value) => setFieldTypeDraft(value as TicketCustomFieldConfig['field_type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setFieldRequiredDraft((current) => !current)} disabled={!selectedFieldId}>
                  {fieldRequiredDraft ? 'Required' : 'Optional'}
                </Button>
                <Button type="button" variant="outline" onClick={() => updateField.mutate()} disabled={!selectedFieldId || !fieldLabelDraft || updateField.isPending}>
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={() => toggleField.mutate()} disabled={!selectedFieldId || toggleField.isPending}>
                  {fields.find((field) => String(field.id) === selectedFieldId)?.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Form Templates</DialogTitle>
            <DialogDescription>Create and update reusable intake templates from the custom field dictionary.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <form
              className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                createTemplate.mutate();
              }}
            >
              <FieldGroup className="contents">
                <Field>
                  <FieldLabel htmlFor="form-template-name">Template name</FieldLabel>
                  <Input id="form-template-name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Ticket type</FieldLabel>
                  <Select value={ticketTypeId} onValueChange={(value) => setTicketTypeId(value ?? anyTypeValue)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={anyTypeValue}>Any type</SelectItem>
                        {ticketTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <Button type="submit" className="self-end" disabled={!templateName || createTemplate.isPending}>
                Add template
              </Button>
            </form>

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Edit template</h3>
                <Badge variant="outline">{templates.length} records</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-[180px_1fr_180px_auto_auto]">
                <Select
                  value={selectedTemplateId}
                  onValueChange={(value) => {
                    const selected = value ?? '';
                    setSelectedTemplateId(selected);
                    hydrateTemplateDrafts(selected);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={String(template.id)}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Input aria-label="Template name draft" value={templateNameDraft} onChange={(event) => setTemplateNameDraft(event.target.value)} />
                <Select value={templateTicketTypeDraft} onValueChange={(value) => setTemplateTicketTypeDraft(value ?? anyTypeValue)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={anyTypeValue}>Any type</SelectItem>
                      {ticketTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setTemplateActiveDraft((current) => !current)} disabled={!selectedTemplateId}>
                  {templateActiveDraft ? 'Active' : 'Inactive'}
                </Button>
                <Button type="button" variant="outline" onClick={() => updateTemplate.mutate()} disabled={!selectedTemplateId || !templateNameDraft || updateTemplate.isPending}>
                  Save
                </Button>
              </div>
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
