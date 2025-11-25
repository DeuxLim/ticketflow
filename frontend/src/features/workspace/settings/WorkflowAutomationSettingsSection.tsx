import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { WorkflowAutomationDialogs } from './WorkflowAutomationDialogs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  activateWorkflow,
  approveApproval,
  createAutomationRule,
  createWorkflow,
  listApprovals,
  listAutomationExecutions,
  listAutomationRules,
  listWorkflows,
  rejectApproval,
  simulateWorkflowTransition,
  testAutomationRule,
  toggleAutomationRule,
  updateAutomationRule,
  updateWorkflow,
} from '@/features/workspace/api/settings-api';
import { apiRequest } from '@/services/api/client';
import type { ApiPaginationMeta, Ticket } from '@/types/api';

type WorkflowAutomationSettingsSectionProps = {
  workspaceSlug: string;
};

type SimulationResult = {
  allowed: boolean;
  reason: string | null;
  requires_approval: boolean;
  required_permission: string | null;
  approver_mode: 'role' | 'users' | null;
  approval_timeout_minutes: number | null;
};

const statusOptions = ['open', 'in_progress', 'pending', 'resolved', 'closed'];

export function WorkflowAutomationSettingsSection({ workspaceSlug }: WorkflowAutomationSettingsSectionProps) {
  const queryClient = useQueryClient();
  const workflowsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'workflows'], queryFn: () => listWorkflows(workspaceSlug) });
  const rulesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'automation-rules'], queryFn: () => listAutomationRules(workspaceSlug) });
  const approvalsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'approvals'], queryFn: () => listApprovals(workspaceSlug) });
  const executionsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'automation-executions'], queryFn: () => listAutomationExecutions(workspaceSlug) });
  const ticketsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'tickets', 'workflow-automation-tests'],
    queryFn: () => apiRequest<{ data: Ticket[]; meta: ApiPaginationMeta }>(`/workspaces/${workspaceSlug}/tickets?per_page=200`),
  });

  const [workflowName, setWorkflowName] = useState('');
  const [isCreateWorkflowDialogOpen, setIsCreateWorkflowDialogOpen] = useState(false);
  const [workflowIsDefault, setWorkflowIsDefault] = useState(false);
  const [transitionFromStatus, setTransitionFromStatus] = useState('open');
  const [transitionToStatus, setTransitionToStatus] = useState('in_progress');
  const [transitionRequiredPermission, setTransitionRequiredPermission] = useState('tickets.manage');
  const [transitionRequiresApproval, setTransitionRequiresApproval] = useState(false);
  const [workflowUpdateNameDrafts, setWorkflowUpdateNameDrafts] = useState<Record<number, string>>({});
  const [workflowUpdateActiveDrafts, setWorkflowUpdateActiveDrafts] = useState<Record<number, boolean>>({});

  const [simulationTicketId, setSimulationTicketId] = useState('');
  const [simulationTargetStatus, setSimulationTargetStatus] = useState('resolved');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [automationRuleName, setAutomationRuleName] = useState('');
  const [isCreateRuleDialogOpen, setIsCreateRuleDialogOpen] = useState(false);
  const [automationEventType, setAutomationEventType] = useState('ticket.created');
  const [automationPriority, setAutomationPriority] = useState(100);
  const [automationConditionsJson, setAutomationConditionsJson] = useState('[]');
  const [automationActionsJson, setAutomationActionsJson] = useState('[{"type":"notify"}]');
  const [automationNameDrafts, setAutomationNameDrafts] = useState<Record<number, string>>({});
  const [automationPriorityDrafts, setAutomationPriorityDrafts] = useState<Record<number, number>>({});
  const [automationTestTicketId, setAutomationTestTicketId] = useState<Record<number, string>>({});
  const [automationTestResults, setAutomationTestResults] = useState<Record<number, string>>({});

  const activate = useMutation({
    mutationFn: (workflowId: number) => activateWorkflow(workspaceSlug, workflowId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'workflows'] }),
  });

  const createWorkflowMutation = useMutation({
    mutationFn: () =>
      createWorkflow(workspaceSlug, {
        name: workflowName.trim(),
        is_default: workflowIsDefault,
        transitions: [
          {
            from_status: transitionFromStatus,
            to_status: transitionToStatus,
            required_permission: transitionRequiredPermission.trim() || null,
            requires_approval: transitionRequiresApproval,
            sort_order: 0,
          },
        ],
      }),
    onSuccess: () => {
      setWorkflowName('');
      setWorkflowIsDefault(false);
      setTransitionFromStatus('open');
      setTransitionToStatus('in_progress');
      setTransitionRequiredPermission('tickets.manage');
      setTransitionRequiresApproval(false);
      setIsCreateWorkflowDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'workflows'] });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, name, isActive }: { workflowId: number; name: string; isActive: boolean }) =>
      updateWorkflow(workspaceSlug, workflowId, { name, is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'workflows'] }),
  });

  const simulateWorkflow = useMutation({
    mutationFn: () => simulateWorkflowTransition(workspaceSlug, Number(simulationTicketId), simulationTargetStatus),
    onSuccess: (response) => setSimulationResult(response.data),
  });

  const toggleRule = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: number; isActive: boolean }) => toggleAutomationRule(workspaceSlug, ruleId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'automation-rules'] }),
  });

  const createRuleMutation = useMutation({
    mutationFn: () =>
      createAutomationRule(workspaceSlug, {
        name: automationRuleName.trim(),
        event_type: automationEventType,
        priority: automationPriority,
        conditions: JSON.parse(automationConditionsJson) as unknown[],
        actions: JSON.parse(automationActionsJson) as unknown[],
        is_active: true,
      }),
    onSuccess: () => {
      setAutomationRuleName('');
      setAutomationEventType('ticket.created');
      setAutomationPriority(100);
      setAutomationConditionsJson('[]');
      setAutomationActionsJson('[{"type":"notify"}]');
      setIsCreateRuleDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'automation-rules'] });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, name, priority }: { ruleId: number; name: string; priority: number }) =>
      updateAutomationRule(workspaceSlug, ruleId, { name, priority }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'automation-rules'] }),
  });

  const dryRunRuleMutation = useMutation({
    mutationFn: ({ ruleId, ticketId }: { ruleId: number; ticketId: number }) => testAutomationRule(workspaceSlug, ruleId, ticketId),
    onSuccess: (response, variables) => {
      setAutomationTestResults((previous) => ({
        ...previous,
        [variables.ruleId]: JSON.stringify(response.data ?? {}, null, 2),
      }));
    },
  });

  const approve = useMutation({
    mutationFn: (approvalId: number) => approveApproval(workspaceSlug, approvalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'approvals'] }),
  });

  const reject = useMutation({
    mutationFn: (approvalId: number) => rejectApproval(workspaceSlug, approvalId, 'Rejected from settings'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'approvals'] }),
  });

  const workflows = workflowsQuery.data?.data ?? [];
  const rules = rulesQuery.data?.data ?? [];
  const approvals = approvalsQuery.data?.data ?? [];
  const executions = executionsQuery.data?.data ?? [];
  const testTickets = ticketsQuery.data?.data ?? [];

  const canCreateWorkflow = workflowName.trim().length > 0 && transitionFromStatus !== transitionToStatus;
  const canSimulateWorkflow = Number(simulationTicketId) > 0 && simulationTargetStatus.length > 0;
  const canCreateAutomationRule = automationRuleName.trim().length > 0 && automationActionsJson.trim().length > 0;

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="w-fit">Workflow</Badge>
                <div className="flex flex-col gap-1">
                  <CardTitle>Workflow lifecycle</CardTitle>
                  <CardDescription>Create, update, activate, and simulate workflow transitions.</CardDescription>
                </div>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateWorkflowDialogOpen(true)}>
                Create workflow
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
          {workflows.map((workflow) => {
            const nameDraft = workflowUpdateNameDrafts[workflow.id] ?? workflow.name;
            const activeDraft = workflowUpdateActiveDrafts[workflow.id] ?? workflow.is_active;
            return (
              <div key={workflow.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{workflow.name}</p>
                    <p className="text-xs text-muted-foreground">{workflow.transitions.length} transitions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workflow.is_default && <Badge>Default</Badge>}
                    {!workflow.is_default && (
                      <Button size="sm" variant="outline" onClick={() => activate.mutate(workflow.id)}>
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <Input value={nameDraft} onChange={(event) => setWorkflowUpdateNameDrafts((previous) => ({ ...previous, [workflow.id]: event.target.value }))} />
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={activeDraft}
                      onCheckedChange={(checked) => setWorkflowUpdateActiveDrafts((previous) => ({ ...previous, [workflow.id]: checked === true }))}
                    />
                    <span>Active</span>
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateWorkflowMutation.mutate({ workflowId: workflow.id, name: nameDraft.trim() || workflow.name, isActive: activeDraft })}
                  >
                    Save
                  </Button>
                </div>
              </div>
            );
          })}

          <Separator />

          <div className="flex flex-col gap-2 rounded-md border p-3">
            <p className="text-sm font-medium">Simulate transition</p>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workflow-simulation-ticket-id">Ticket ID</FieldLabel>
                <Input
                  id="workflow-simulation-ticket-id"
                  type="number"
                  value={simulationTicketId}
                  onChange={(event) => setSimulationTicketId(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="workflow-simulation-target-status">Target status</FieldLabel>
                <Input
                  id="workflow-simulation-target-status"
                  list="workflow-target-statuses"
                  value={simulationTargetStatus}
                  onChange={(event) => setSimulationTargetStatus(event.target.value)}
                />
                <FieldDescription>Choose the status to test against the active workflow.</FieldDescription>
                <datalist id="workflow-target-statuses">
                  {statusOptions.map((status) => (
                    <option key={status} value={status} />
                  ))}
                </datalist>
              </Field>
            </FieldGroup>
            {simulateWorkflow.isError && (
              <p className="text-xs text-destructive">{(simulateWorkflow.error as Error).message}</p>
            )}
            <Button size="sm" variant="outline" disabled={!canSimulateWorkflow || simulateWorkflow.isPending} onClick={() => simulateWorkflow.mutate()}>
              {simulateWorkflow.isPending ? 'Simulating...' : 'Simulate transition'}
            </Button>
            {simulationResult && (
              <div className="rounded border p-2 text-xs">
                <p className="font-medium">Allowed: {simulationResult.allowed ? 'yes' : 'no'}</p>
                {simulationResult.reason && <p className="text-muted-foreground">Reason: {simulationResult.reason}</p>}
                <p className="text-muted-foreground">Requires approval: {simulationResult.requires_approval ? 'yes' : 'no'}</p>
                {simulationResult.required_permission && (
                  <p className="text-muted-foreground">Required permission: {simulationResult.required_permission}</p>
                )}
              </div>
            )}
            {testTickets.length > 0 && (
              <p className="text-xs text-muted-foreground">Sample ticket IDs: {testTickets.slice(0, 5).map((ticket) => ticket.id).join(', ')}</p>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Pending approvals</p>
            {approvals.length === 0 && <p className="text-xs text-muted-foreground">No pending approvals.</p>}
            {approvals.map((approval) => (
              <div key={approval.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm">Approval #{approval.id}</p>
                    <p className="text-xs text-muted-foreground">
                      ticket #{approval.ticket_id} to {approval.requested_transition_to_status ?? 'n/a'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => approve.mutate(approval.id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => reject.mutate(approval.id)}>Reject</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="w-fit">Automation</Badge>
                <div className="flex flex-col gap-1">
                  <CardTitle>Rules and execution logs</CardTitle>
                  <CardDescription>Create, update, test, and toggle automation rules.</CardDescription>
                </div>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateRuleDialogOpen(true)}>
                Create rule
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {rules.map((rule) => {
              const nameDraft = automationNameDrafts[rule.id] ?? rule.name;
              const priorityDraft = automationPriorityDrafts[rule.id] ?? rule.priority;
              const testTicketIdDraft = automationTestTicketId[rule.id] ?? '';

              return (
                <div key={rule.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{rule.event_type} • priority {rule.priority}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleRule.mutate({ ruleId: rule.id, isActive: !rule.is_active })}
                    >
                      {rule.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                    <Input value={nameDraft} onChange={(event) => setAutomationNameDrafts((previous) => ({ ...previous, [rule.id]: event.target.value }))} />
                    <Input
                      type="number"
                      value={priorityDraft}
                      onChange={(event) => setAutomationPriorityDrafts((previous) => ({ ...previous, [rule.id]: Number(event.target.value) || 0 }))}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRuleMutation.mutate({ ruleId: rule.id, name: nameDraft.trim() || rule.name, priority: priorityDraft })}
                    >
                      Save
                    </Button>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input
                      placeholder="Ticket ID for dry-run"
                      type="number"
                      value={testTicketIdDraft}
                      onChange={(event) => setAutomationTestTicketId((previous) => ({ ...previous, [rule.id]: event.target.value }))}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={Number(testTicketIdDraft) <= 0}
                      onClick={() => dryRunRuleMutation.mutate({ ruleId: rule.id, ticketId: Number(testTicketIdDraft) })}
                    >
                      Dry run
                    </Button>
                  </div>

                  {automationTestResults[rule.id] && (
                    <pre className="mt-2 overflow-x-auto rounded border p-2 text-xs">{automationTestResults[rule.id]}</pre>
                  )}
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Recent executions</p>
            {executions.slice(0, 10).map((execution) => (
              <div key={execution.id} className="rounded-md border p-3 text-xs">
                <p className="font-medium">
                  {execution.rule?.name ?? 'Rule'} • {execution.status}
                </p>
                <p className="text-muted-foreground">
                  {execution.ticket?.ticket_number ?? 'N/A'} • {execution.event_type} • {new Date(execution.executed_at).toLocaleString()}
                </p>
                {execution.error_message && <p className="text-destructive">{execution.error_message}</p>}
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      </div>
      <WorkflowAutomationDialogs
        isCreateWorkflowDialogOpen={isCreateWorkflowDialogOpen}
        onCreateWorkflowDialogOpenChange={setIsCreateWorkflowDialogOpen}
        workflowName={workflowName}
        workflowIsDefault={workflowIsDefault}
        transitionFromStatus={transitionFromStatus}
        transitionToStatus={transitionToStatus}
        transitionRequiredPermission={transitionRequiredPermission}
        transitionRequiresApproval={transitionRequiresApproval}
        setWorkflowName={setWorkflowName}
        setWorkflowIsDefault={setWorkflowIsDefault}
        setTransitionFromStatus={setTransitionFromStatus}
        setTransitionToStatus={setTransitionToStatus}
        setTransitionRequiredPermission={setTransitionRequiredPermission}
        setTransitionRequiresApproval={setTransitionRequiresApproval}
        createWorkflowError={createWorkflowMutation.isError ? (createWorkflowMutation.error as Error).message : null}
        canCreateWorkflow={canCreateWorkflow}
        createWorkflowPending={createWorkflowMutation.isPending}
        onCreateWorkflow={() => createWorkflowMutation.mutate()}
        isCreateRuleDialogOpen={isCreateRuleDialogOpen}
        onCreateRuleDialogOpenChange={setIsCreateRuleDialogOpen}
        automationRuleName={automationRuleName}
        automationEventType={automationEventType}
        automationPriority={automationPriority}
        automationConditionsJson={automationConditionsJson}
        automationActionsJson={automationActionsJson}
        setAutomationRuleName={setAutomationRuleName}
        setAutomationEventType={setAutomationEventType}
        setAutomationPriority={setAutomationPriority}
        setAutomationConditionsJson={setAutomationConditionsJson}
        setAutomationActionsJson={setAutomationActionsJson}
        createRuleError={createRuleMutation.isError ? (createRuleMutation.error as Error).message : null}
        canCreateAutomationRule={canCreateAutomationRule}
        createRulePending={createRuleMutation.isPending}
        onCreateRule={() => createRuleMutation.mutate()}
      />
    </>
  );
}
