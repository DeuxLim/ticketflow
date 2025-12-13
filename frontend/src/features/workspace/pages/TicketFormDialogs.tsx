import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Create Ticket</SheetTitle>
          <SheetDescription>Create a ticket with status, priority, and assignee details.</SheetDescription>
        </SheetHeader>
        <div className="px-4">
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
        </div>
        <SheetFooter className="border-t">
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">Cancel</Button>
          <Button disabled={form.formState.isSubmitting || isPending} form="create-ticket-form" type="submit">
            {isPending ? 'Creating...' : 'Create Ticket'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Edit Ticket</SheetTitle>
          <SheetDescription>Update customer, assignee, status, priority, and details.</SheetDescription>
        </SheetHeader>
        <div className="px-4">
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
        </div>
        <SheetFooter className="border-t">
          <Button onClick={onCancel} type="button" variant="outline">Cancel</Button>
          <Button disabled={submitDisabled} form="edit-ticket-form" type="submit">
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
