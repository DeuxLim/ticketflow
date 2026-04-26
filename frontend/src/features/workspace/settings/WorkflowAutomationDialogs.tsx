import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const eventTypeOptions = ['ticket.created', 'ticket.updated', 'ticket.comment_added', 'ticket.sla.breached'];

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
  automationConditionsJson: string;
  automationActionsJson: string;
  setAutomationRuleName: (value: string) => void;
  setAutomationEventType: (value: string) => void;
  setAutomationPriority: (value: number) => void;
  setAutomationConditionsJson: (value: string) => void;
  setAutomationActionsJson: (value: string) => void;
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
  automationConditionsJson,
  automationActionsJson,
  setAutomationRuleName,
  setAutomationEventType,
  setAutomationPriority,
  setAutomationConditionsJson,
  setAutomationActionsJson,
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
                  <Input id="workflow-from-status" value={transitionFromStatus} onChange={(event) => setTransitionFromStatus(event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="workflow-to-status">To status</FieldLabel>
                  <Input id="workflow-to-status" value={transitionToStatus} onChange={(event) => setTransitionToStatus(event.target.value)} />
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
              Start with a named event trigger, priority, and JSON conditions/actions for the rule engine.
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
                <FieldLabel htmlFor="automation-conditions">Conditions JSON</FieldLabel>
                <Input id="automation-conditions" value={automationConditionsJson} onChange={(event) => setAutomationConditionsJson(event.target.value)} />
                <FieldDescription>Use an empty array when every matching event should run the rule.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="automation-actions">Actions JSON</FieldLabel>
                <Input id="automation-actions" value={automationActionsJson} onChange={(event) => setAutomationActionsJson(event.target.value)} />
              </Field>
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
