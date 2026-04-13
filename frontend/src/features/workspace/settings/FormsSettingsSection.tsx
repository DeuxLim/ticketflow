import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TicketCustomFieldConfig } from '@/types/api';
import {
  createTicketCustomField,
  createTicketFormTemplate,
  listTicketCustomFields,
  listTicketFormTemplates,
  listTicketTypes,
} from './settings-api';

type FormsSettingsSectionProps = {
  workspaceSlug: string;
};

const fieldTypes: TicketCustomFieldConfig['field_type'][] = ['text', 'textarea', 'number', 'select', 'multiselect', 'checkbox', 'date'];

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function FormsSettingsSection({ workspaceSlug }: FormsSettingsSectionProps) {
  const queryClient = useQueryClient();
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<TicketCustomFieldConfig['field_type']>('text');
  const [templateName, setTemplateName] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');

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
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-custom-fields'] });
    },
  });

  const createTemplate = useMutation({
    mutationFn: () =>
      createTicketFormTemplate(workspaceSlug, {
        name: templateName,
        ticket_type_id: ticketTypeId ? Number(ticketTypeId) : null,
        field_schema: fields.filter((field) => field.is_active).map((field) => ({ key: field.key, required: field.is_required })),
        is_default: false,
        is_active: true,
      }),
    onSuccess: () => {
      setTemplateName('');
      setTicketTypeId('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-form-templates'] });
    },
  });

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Forms
          </Badge>
          <CardTitle>Custom fields</CardTitle>
          <CardDescription>Define reusable fields for future dynamic ticket forms.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
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
          <CardDescription>Create templates from the active custom field dictionary.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
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
                <Select value={ticketTypeId} onValueChange={(value) => setTicketTypeId(value ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
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
            <Button type="submit" className="self-end" disabled={!templateName || !ticketTypeId || createTemplate.isPending}>
              Add template
            </Button>
          </form>

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
    </div>
  );
}
