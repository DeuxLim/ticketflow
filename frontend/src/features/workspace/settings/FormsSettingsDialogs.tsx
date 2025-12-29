import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TicketCustomFieldConfig, TicketFormTemplateConfig, TicketTypeConfig } from '@/types/api';

type FormsSettingsDialogsProps = {
  anyTypeValue: string;
  fieldLabel: string;
  fieldLabelDraft: string;
  fieldRequiredDraft: boolean;
  fields: TicketCustomFieldConfig[];
  fieldType: TicketCustomFieldConfig['field_type'];
  fieldTypeDraft: TicketCustomFieldConfig['field_type'];
  fieldTypes: TicketCustomFieldConfig['field_type'][];
  formError: string | null;
  isCreatingField: boolean;
  isCreatingTemplate: boolean;
  isFieldsOpen: boolean;
  isSavingField: boolean;
  isSavingTemplate: boolean;
  isTemplatesOpen: boolean;
  onCreateField: () => void;
  onCreateTemplate: () => void;
  onSaveField: () => void;
  onSaveTemplate: () => void;
  onSelectField: (id: string) => void;
  onSelectTemplate: (id: string) => void;
  onSetFieldsOpen: (open: boolean) => void;
  onSetTemplatesOpen: (open: boolean) => void;
  onToggleField: () => void;
  selectedFieldId: string;
  selectedTemplateId: string;
  section: 'fields' | 'templates';
  setFieldLabel: (value: string) => void;
  setFieldLabelDraft: (value: string) => void;
  setFieldRequiredDraft: (value: boolean | ((current: boolean) => boolean)) => void;
  setFieldType: (value: TicketCustomFieldConfig['field_type']) => void;
  setFieldTypeDraft: (value: TicketCustomFieldConfig['field_type']) => void;
  setSelectedFieldId: (value: string) => void;
  setSelectedTemplateId: (value: string) => void;
  setTemplateActiveDraft: (value: boolean | ((current: boolean) => boolean)) => void;
  setTemplateName: (value: string) => void;
  setTemplateNameDraft: (value: string) => void;
  setTemplateTicketTypeDraft: (value: string) => void;
  setTicketTypeId: (value: string) => void;
  templateActiveDraft: boolean;
  templateName: string;
  templateNameDraft: string;
  templates: TicketFormTemplateConfig[];
  templateTicketTypeDraft: string;
  ticketTypeId: string;
  ticketTypes: TicketTypeConfig[];
};

export function FormsSettingsDialogs({
  anyTypeValue,
  fieldLabel,
  fieldLabelDraft,
  fieldRequiredDraft,
  fields,
  fieldType,
  fieldTypeDraft,
  fieldTypes,
  formError,
  isCreatingField,
  isCreatingTemplate,
  isFieldsOpen,
  isSavingField,
  isSavingTemplate,
  isTemplatesOpen,
  onCreateField,
  onCreateTemplate,
  onSaveField,
  onSaveTemplate,
  onSelectField,
  onSelectTemplate,
  onSetFieldsOpen,
  onSetTemplatesOpen,
  onToggleField,
  selectedFieldId,
  selectedTemplateId,
  section,
  setFieldLabel,
  setFieldLabelDraft,
  setFieldRequiredDraft,
  setFieldType,
  setFieldTypeDraft,
  setSelectedFieldId,
  setSelectedTemplateId,
  setTemplateActiveDraft,
  setTemplateName,
  setTemplateNameDraft,
  setTemplateTicketTypeDraft,
  setTicketTypeId,
  templateActiveDraft,
  templateName,
  templateNameDraft,
  templates,
  templateTicketTypeDraft,
  ticketTypeId,
  ticketTypes,
}: FormsSettingsDialogsProps) {
  if (section === 'fields') {
    return (
      <>
        <CardSummary
          actionLabel="Manage fields"
          description={`${fields.length} fields configured for dynamic ticket intake.`}
          onOpen={() => onSetFieldsOpen(true)}
          title="Field dictionary"
        />

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

        <Dialog open={isFieldsOpen} onOpenChange={onSetFieldsOpen}>
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
                onCreateField();
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
              <Button type="submit" className="self-end" disabled={!fieldLabel || isCreatingField}>
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
                    onSelectField(selected);
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
                <Button type="button" variant="outline" onClick={onSaveField} disabled={!selectedFieldId || !fieldLabelDraft || isSavingField}>
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={onToggleField} disabled={!selectedFieldId || isSavingField}>
                  {fields.find((field) => String(field.id) === selectedFieldId)?.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
        </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <CardSummary
        actionLabel="Manage templates"
        description={`${templates.length} templates map ticket types to dynamic fields.`}
        onOpen={() => onSetTemplatesOpen(true)}
        title="Template library"
      />

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

      <Dialog open={isTemplatesOpen} onOpenChange={onSetTemplatesOpen}>
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
                onCreateTemplate();
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
              <Button type="submit" className="self-end" disabled={!templateName || isCreatingTemplate}>
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
                    onSelectTemplate(selected);
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
                <Button type="button" variant="outline" onClick={onSaveTemplate} disabled={!selectedTemplateId || !templateNameDraft || isSavingTemplate}>
                  Save
                </Button>
              </div>
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CardSummary({
  actionLabel,
  description,
  onOpen,
  title,
}: {
  actionLabel: string;
  description: string;
  onOpen: () => void;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Button type="button" variant="outline" onClick={onOpen}>
        {actionLabel}
      </Button>
    </div>
  );
}
