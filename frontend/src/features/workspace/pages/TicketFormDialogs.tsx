import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type {
  Customer,
  TicketCategoryConfig,
  TicketCustomFieldConfig,
  TicketFormTemplateConfig,
  TicketQueueConfig,
  TicketTagConfig,
} from '@/types/api';
import { TicketFormFields, type MemberOption } from './TicketFormFields';
import type { TicketForm } from './ticketForm';

type TicketDialogFieldOptions = {
  activeCategories: TicketCategoryConfig[];
  activeCustomFields: TicketCustomFieldConfig[];
  activeQueues: TicketQueueConfig[];
  activeTags: TicketTagConfig[];
  customers: Customer[];
  members: MemberOption[];
  templates: TicketFormTemplateConfig[];
};

type CreateTicketDialogProps = TicketDialogFieldOptions & {
  errorMessage: string | null;
  form: UseFormReturn<TicketForm>;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TicketForm) => void;
  onTemplateChange: (templateId: string) => void;
  open: boolean;
  selectedTemplateId: string;
};

type EditTicketDialogProps = TicketDialogFieldOptions & {
  errorMessage: string | null;
  form: UseFormReturn<TicketForm>;
  isPending: boolean;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TicketForm) => void;
  onTemplateChange: (templateId: string) => void;
  open: boolean;
  selectedTemplateId: string;
  submitDisabled: boolean;
};

export function CreateTicketDialog({
  activeCategories,
  activeCustomFields,
  activeQueues,
  activeTags,
  customers,
  errorMessage,
  form,
  isPending,
  members,
  onOpenChange,
  onSubmit,
  onTemplateChange,
  open,
  selectedTemplateId,
  templates,
}: CreateTicketDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Ticket</DialogTitle>
          <DialogDescription>Create a ticket with status, priority, and assignee details.</DialogDescription>
        </DialogHeader>
        <TicketFormFields
          activeCategories={activeCategories}
          activeCustomFields={activeCustomFields}
          activeQueues={activeQueues}
          activeTags={activeTags}
          customers={customers}
          form={form}
          formId="create-ticket-form"
          members={members}
          selectedTemplateId={selectedTemplateId}
          templates={templates}
          onTemplateChange={onTemplateChange}
          onSubmit={onSubmit}
        />
        {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">Cancel</Button>
          <Button disabled={form.formState.isSubmitting || isPending} form="create-ticket-form" type="submit">
            {isPending ? 'Creating...' : 'Create Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditTicketDialog({
  activeCategories,
  activeCustomFields,
  activeQueues,
  activeTags,
  customers,
  errorMessage,
  form,
  isPending,
  members,
  onCancel,
  onOpenChange,
  onSubmit,
  onTemplateChange,
  open,
  selectedTemplateId,
  submitDisabled,
  templates,
}: EditTicketDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Ticket</DialogTitle>
          <DialogDescription>Update customer, assignee, status, priority, and details.</DialogDescription>
        </DialogHeader>
        <TicketFormFields
          activeCategories={activeCategories}
          activeCustomFields={activeCustomFields}
          activeQueues={activeQueues}
          activeTags={activeTags}
          customers={customers}
          form={form}
          formId="edit-ticket-form"
          members={members}
          selectedTemplateId={selectedTemplateId}
          templates={templates}
          onTemplateChange={onTemplateChange}
          onSubmit={onSubmit}
        />
        {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
        <DialogFooter>
          <Button onClick={onCancel} type="button" variant="outline">Cancel</Button>
          <Button disabled={submitDisabled} form="edit-ticket-form" type="submit">
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
