import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  activateWorkflow,
  approveApproval,
  listApprovals,
  listAutomationExecutions,
  listAutomationRules,
  listWorkflows,
  rejectApproval,
  toggleAutomationRule,
} from './settings-api';

type WorkflowAutomationSettingsSectionProps = {
  workspaceSlug: string;
};

export function WorkflowAutomationSettingsSection({ workspaceSlug }: WorkflowAutomationSettingsSectionProps) {
  const queryClient = useQueryClient();
  const workflowsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'workflows'], queryFn: () => listWorkflows(workspaceSlug) });
  const rulesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'automation-rules'], queryFn: () => listAutomationRules(workspaceSlug) });
  const approvalsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'approvals'], queryFn: () => listApprovals(workspaceSlug) });
  const executionsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'automation-executions'], queryFn: () => listAutomationExecutions(workspaceSlug) });

  const activate = useMutation({
    mutationFn: (workflowId: number) => activateWorkflow(workspaceSlug, workflowId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'workflows'] }),
  });

  const toggleRule = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: number; isActive: boolean }) => toggleAutomationRule(workspaceSlug, ruleId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'automation-rules'] }),
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

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">Workflow</Badge>
          <CardTitle>Workflow lifecycle</CardTitle>
          <CardDescription>Activate default workflow and inspect transition/approval paths.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
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
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Pending approvals</p>
            {approvals.length === 0 && <p className="text-xs text-muted-foreground">No pending approvals.</p>}
            {approvals.map((approval) => (
              <div key={approval.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm">Approval #{approval.id}</p>
                    <p className="text-xs text-muted-foreground">
                      ticket #{approval.ticket_id} → {approval.requested_transition_to_status ?? 'n/a'}
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
          <Badge variant="secondary" className="w-fit">Automation</Badge>
          <CardTitle>Rules and execution logs</CardTitle>
          <CardDescription>Toggle automation rules and inspect recent execution outcomes.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
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
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
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
  );
}
