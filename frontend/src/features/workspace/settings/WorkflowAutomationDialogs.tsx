import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ticketStatusLabel, ticketStatusValues } from '@/features/workspace/pages/ticketForm';

const eventTypeOptions = ['ticket.created', 'ticket.updated', 'ticket.comment_added', 'ticket.sla.breached'];
const conditionOptions = [
  { value: 'none', label: 'Every matching ticket' },
  { value: 'status', label: 'Status equals' },
  { value: 'priority', label: 'Priority equals' },
];
const actionOptions = [
  { value: 'set_status', label: 'Set status' },
  { value: 'set_priority', label: 'Set priority' },
  { value: 'add_tag', label: 'Add tag' },
  { value: 'assign_actor', label: 'Assign to actor' },
  { value: 'request_approval', label: 'Request approval' },
];
const priorityOptions = ['low', 'medium', 'high', 'urgent'];

type Props = {
  isCreateWorkflowDialogOpen: boolean;
  onCreateWorkflowDialogOpenChange: (open: boolean) => void;
  workflowName: string;
  workflowIsDefault: boolean;
  transitionFromStatus: string;
  transitionToStatus: string;
  transitionRequiredPermission: string;
  transitionRequiresApproval: boolean;
  setWorkflowName: (value: string) => void;
  setWorkflowIsDefault: (value: boolean) => void;
  setTransitionFromStatus: (value: string) => void;
  setTransitionToStatus: (value: string) => void;
  setTransitionRequiredPermission: (value: string) => void;
  setTransitionRequiresApproval: (value: boolean) => void;
  createWorkflowError: string | null;
  canCreateWorkflow: boolean;
  createWorkflowPending: boolean;
  onCreateWorkflow: () => void;

  isCreateRuleDialogOpen: boolean;
  onCreateRuleDialogOpenChange: (open: boolean) => void;
  automationRuleName: string;
  automationEventType: string;
  automationPriority: number;
  automationConditionField: string;
  automationConditionValue: string;
  automationActionType: string;
  automationActionValue: string;
  setAutomationRuleName: (value: string) => void;
  setAutomationEventType: (value: string) => void;
  setAutomationPriority: (value: number) => void;
  setAutomationConditionField: (value: string) => void;
  setAutomationConditionValue: (value: string) => void;
  setAutomationActionType: (value: string) => void;
  setAutomationActionValue: (value: string) => void;
  createRuleError: string | null;
  canCreateAutomationRule: boolean;
  createRulePending: boolean;
  onCreateRule: () => void;
};

export function WorkflowAutomationDialogs({
  isCreateWorkflowDialogOpen,
  onCreateWorkflowDialogOpenChange,
  workflowName,
  workflowIsDefault,
  transitionFromStatus,
  transitionToStatus,
  transitionRequiredPermission,
  transitionRequiresApproval,
  setWorkflowName,
  setWorkflowIsDefault,
  setTransitionFromStatus,
  setTransitionToStatus,
  setTransitionRequiredPermission,
  setTransitionRequiresApproval,
  createWorkflowError,
  canCreateWorkflow,
  createWorkflowPending,
  onCreateWorkflow,
  isCreateRuleDialogOpen,
  onCreateRuleDialogOpenChange,
  automationRuleName,
  automationEventType,
  automationPriority,
  automationConditionField,
  automationConditionValue,
  automationActionType,
  automationActionValue,
  setAutomationRuleName,
  setAutomationEventType,
  setAutomationPriority,
  setAutomationConditionField,
  setAutomationConditionValue,
  setAutomationActionType,
  setAutomationActionValue,
  createRuleError,
  canCreateAutomationRule,
  createRulePending,
  onCreateRule,
}: Props) {
  return (
    <>
      <Dialog open={isCreateWorkflowDialogOpen} onOpenChange={onCreateWorkflowDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription>
              Define the first transition for a workflow. Additional transition editing can happen after creation.
            </DialogDescription>
          </DialogHeader>
          <form
            id="create-workflow-form"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateWorkflow();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workflow-name">Workflow name</FieldLabel>
                <Input id="workflow-name" value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="workflow-from-status">From status</FieldLabel>
                  <Select value={transitionFromStatus} onValueChange={(value) => value && setTransitionFromStatus(value)}>
                    <SelectTrigger id="workflow-from-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ticketStatusValues.map((status) => (
                          <SelectItem key={status} value={status}>{ticketStatusLabel(status)}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="workflow-to-status">To status</FieldLabel>
                  <Select value={transitionToStatus} onValueChange={(value) => value && setTransitionToStatus(value)}>
                    <SelectTrigger id="workflow-to-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ticketStatusValues.map((status) => (
                          <SelectItem key={status} value={status}>{ticketStatusLabel(status)}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="workflow-required-permission">Required permission (optional)</FieldLabel>
                <Input
                  id="workflow-required-permission"
                  value={transitionRequiredPermission}
                  onChange={(event) => setTransitionRequiredPermission(event.target.value)}
                />
                <FieldDescription>Leave blank when the transition should not require a specific permission.</FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="workflow-requires-approval"
                  checked={transitionRequiresApproval}
                  onCheckedChange={(checked) => setTransitionRequiresApproval(checked === true)}
                />
                <FieldLabel htmlFor="workflow-requires-approval">Transition requires approval</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="workflow-default"
                  checked={workflowIsDefault}
                  onCheckedChange={(checked) => setWorkflowIsDefault(checked === true)}
                />
                <FieldLabel htmlFor="workflow-default">Set as default workflow</FieldLabel>
              </Field>
              {createWorkflowError && (
                <p className="text-xs text-destructive">{createWorkflowError}</p>
              )}
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onCreateWorkflowDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canCreateWorkflow || createWorkflowPending}
              form="create-workflow-form"
              type="submit"
            >
              {createWorkflowPending ? 'Creating...' : 'Create workflow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateRuleDialogOpen} onOpenChange={onCreateRuleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
            <DialogDescription>
              Start with a named trigger, one optional condition, and one ticket-focused action.
            </DialogDescription>
          </DialogHeader>
          <form
            id="create-automation-rule-form"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateRule();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="automation-rule-name">Rule name</FieldLabel>
                <Input id="automation-rule-name" value={automationRuleName} onChange={(event) => setAutomationRuleName(event.target.value)} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="automation-event-type">Event type</FieldLabel>
                  <Input
                    id="automation-event-type"
                    list="automation-event-types"
                    value={automationEventType}
                    onChange={(event) => setAutomationEventType(event.target.value)}
                  />
                  <datalist id="automation-event-types">
                    {eventTypeOptions.map((eventType) => (
                      <option key={eventType} value={eventType} />
                    ))}
                  </datalist>
                </Field>
                <Field>
                  <FieldLabel htmlFor="automation-priority">Priority</FieldLabel>
                  <Input
                    id="automation-priority"
                    type="number"
                    value={automationPriority}
                    onChange={(event) => setAutomationPriority(Number(event.target.value) || 0)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="automation-condition-field">Run when</FieldLabel>
                <Select
                  value={automationConditionField}
                  onValueChange={(value) => {
                    if (!value) return;
                    setAutomationConditionField(value);
                    setAutomationConditionValue(value === 'status' ? 'open' : value === 'priority' ? 'medium' : '');
                  }}
                >
                  <SelectTrigger id="automation-condition-field"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {conditionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>Keep this broad unless the rule should only match one status or priority.</FieldDescription>
              </Field>
              {automationConditionField !== 'none' && (
                <Field>
                  <FieldLabel htmlFor="automation-condition-value">Condition value</FieldLabel>
                  <Select value={automationConditionValue} onValueChange={(value) => value && setAutomationConditionValue(value)}>
                    <SelectTrigger id="automation-condition-value"><SelectValue placeholder="Choose value" /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(automationConditionField === 'status' ? ticketStatusValues : priorityOptions).map((option) => (
                          <SelectItem key={option} value={option}>
                            {automationConditionField === 'status' ? ticketStatusLabel(option) : option}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="automation-action-type">Then</FieldLabel>
                  <Select
                    value={automationActionType}
                    onValueChange={(value) => {
                      if (!value) return;
                      setAutomationActionType(value);
                      setAutomationActionValue(value === 'set_status' ? 'in_progress' : value === 'set_priority' ? 'medium' : '');
                    }}
                  >
                    <SelectTrigger id="automation-action-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {actionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                {automationActionType !== 'assign_actor' && automationActionType !== 'request_approval' && (
                  <Field>
                    <FieldLabel htmlFor="automation-action-value">Action value</FieldLabel>
                    {automationActionType === 'set_status' || automationActionType === 'set_priority' ? (
                      <Select value={automationActionValue} onValueChange={(value) => value && setAutomationActionValue(value)}>
                        <SelectTrigger id="automation-action-value"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {(automationActionType === 'set_status' ? ticketStatusValues : priorityOptions).map((option) => (
                              <SelectItem key={option} value={option}>
                                {automationActionType === 'set_status' ? ticketStatusLabel(option) : option}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="automation-action-value" value={automationActionValue} onChange={(event) => setAutomationActionValue(event.target.value)} />
                    )}
                  </Field>
                )}
              </div>
              {createRuleError && (
                <p className="text-xs text-destructive">{createRuleError}</p>
              )}
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onCreateRuleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canCreateAutomationRule || createRulePending}
              form="create-automation-rule-form"
              type="submit"
            >
              {createRulePending ? 'Creating...' : 'Create rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
