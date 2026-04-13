<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\ApplyWorkflowTransitionRequest;
use App\Http\Requests\Workspaces\StoreWorkflowTransitionRequest;
use App\Models\ApprovalStep;
use App\Models\Ticket;
use App\Models\TicketWorkflow;
use App\Models\WorkflowTransition;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Workspaces\WorkspaceFoundationBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WorkflowController extends Controller
{
    public function __construct(private readonly WorkspaceFoundationBootstrapper $bootstrapper)
    {
    }

    public function index(Workspace $workspace): JsonResponse
    {
        $this->bootstrapper->ensureSettingsFoundation($workspace);

        return response()->json([
            'data' => TicketWorkflow::query()
                ->where('workspace_id', $workspace->id)
                ->with(['transitions' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')])
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(StoreWorkflowTransitionRequest $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $workflow = DB::transaction(function () use ($request, $workspace): TicketWorkflow {
            if ($request->boolean('is_default')) {
                TicketWorkflow::query()
                    ->where('workspace_id', $workspace->id)
                    ->update(['is_default' => false]);
            }

            $workflow = TicketWorkflow::query()->create([
                'workspace_id' => $workspace->id,
                'name' => $request->string('name')->toString(),
                'is_default' => $request->boolean('is_default', false),
                'is_active' => true,
            ]);

            foreach ($request->input('transitions', []) as $transition) {
                WorkflowTransition::query()->create([
                    'ticket_workflow_id' => $workflow->id,
                    'from_status' => $transition['from_status'],
                    'to_status' => $transition['to_status'],
                    'required_permission' => $transition['required_permission'] ?? null,
                    'requires_approval' => (bool) ($transition['requires_approval'] ?? false),
                    'sort_order' => (int) ($transition['sort_order'] ?? 0),
                    'approver_mode' => $transition['approver_mode'] ?? null,
                    'approver_role_slug' => $transition['approver_role_slug'] ?? null,
                    'approver_user_ids_json' => $transition['approver_user_ids'] ?? null,
                    'approval_timeout_minutes' => $transition['approval_timeout_minutes'] ?? null,
                ]);
            }

            return $workflow;
        });

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'workflow.created',
            resourceType: TicketWorkflow::class,
            resourceId: (string) $workflow->id,
            meta: ['name' => $workflow->name],
            request: $request
        );

        return response()->json([
            'data' => $workflow->load('transitions'),
        ], 201);
    }

    public function update(Request $request, Workspace $workspace, TicketWorkflow $workflow, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($workflow->workspace_id !== $workspace->id, 404);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
            'transitions' => ['sometimes', 'array', 'min:1'],
            'transitions.*.id' => ['nullable', 'integer'],
            'transitions.*.from_status' => ['required_with:transitions', 'string', 'max:40'],
            'transitions.*.to_status' => ['required_with:transitions', 'string', 'max:40'],
            'transitions.*.required_permission' => ['nullable', 'string', 'max:120'],
            'transitions.*.requires_approval' => ['sometimes', 'boolean'],
            'transitions.*.sort_order' => ['sometimes', 'integer', 'min:0'],
            'transitions.*.approver_mode' => ['nullable', Rule::in(['role', 'users'])],
            'transitions.*.approver_role_slug' => ['nullable', 'string', 'max:80'],
            'transitions.*.approver_user_ids' => ['nullable', 'array'],
            'transitions.*.approver_user_ids.*' => ['integer'],
            'transitions.*.approval_timeout_minutes' => ['nullable', 'integer', 'min:5', 'max:10080'],
        ]);

        DB::transaction(function () use ($validated, $workspace, $workflow): void {
            if (array_key_exists('is_default', $validated) && (bool) $validated['is_default'] === true) {
                TicketWorkflow::query()->where('workspace_id', $workspace->id)->whereKeyNot($workflow->id)->update(['is_default' => false]);
            }

            $workflow->fill(collect($validated)->only(['name', 'is_active', 'is_default'])->toArray());
            $workflow->save();

            if (! array_key_exists('transitions', $validated)) {
                return;
            }

            $seenIds = [];
            foreach ($validated['transitions'] as $index => $payload) {
                $transition = null;
                if (! empty($payload['id'])) {
                    $transition = WorkflowTransition::query()
                        ->where('ticket_workflow_id', $workflow->id)
                        ->whereKey((int) $payload['id'])
                        ->first();
                }

                if (! $transition) {
                    $transition = new WorkflowTransition([
                        'ticket_workflow_id' => $workflow->id,
                    ]);
                }

                $transition->fill([
                    'from_status' => $payload['from_status'],
                    'to_status' => $payload['to_status'],
                    'required_permission' => $payload['required_permission'] ?? null,
                    'requires_approval' => (bool) ($payload['requires_approval'] ?? false),
                    'sort_order' => (int) ($payload['sort_order'] ?? $index),
                    'approver_mode' => $payload['approver_mode'] ?? null,
                    'approver_role_slug' => $payload['approver_role_slug'] ?? null,
                    'approver_user_ids_json' => $payload['approver_user_ids'] ?? [],
                    'approval_timeout_minutes' => $payload['approval_timeout_minutes'] ?? null,
                ]);
                $transition->save();
                $seenIds[] = $transition->id;
            }

            WorkflowTransition::query()
                ->where('ticket_workflow_id', $workflow->id)
                ->whereNotIn('id', $seenIds)
                ->delete();
        });

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'workflow.updated',
            resourceType: TicketWorkflow::class,
            resourceId: (string) $workflow->id,
            meta: ['fields' => array_keys($validated)],
            request: $request
        );

        return response()->json(['data' => $workflow->fresh()->load('transitions')]);
    }

    public function activate(Request $request, Workspace $workspace, TicketWorkflow $workflow, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($workflow->workspace_id !== $workspace->id, 404);

        DB::transaction(function () use ($workspace, $workflow): void {
            TicketWorkflow::query()
                ->where('workspace_id', $workspace->id)
                ->update(['is_default' => false]);

            $workflow->forceFill([
                'is_active' => true,
                'is_default' => true,
            ])->save();
        });

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'workflow.activated',
            resourceType: TicketWorkflow::class,
            resourceId: (string) $workflow->id,
            request: $request
        );

        return response()->json(['data' => $workflow->fresh()->load('transitions')]);
    }

    public function transition(
        ApplyWorkflowTransitionRequest $request,
        Workspace $workspace,
        Ticket $ticket,
        AuditLogger $auditLogger
    ): JsonResponse {
        $workflow = TicketWorkflow::query()
            ->where('workspace_id', $workspace->id)
            ->where('is_default', true)
            ->with('transitions')
            ->first();

        abort_if(! $workflow, 422, 'No default workflow configured.');

        $transition = $workflow->transitions
            ->where('from_status', $ticket->status)
            ->where('to_status', $request->string('to_status')->toString())
            ->first();

        abort_if(! $transition, 422, 'Transition is not allowed.');

        if ($transition->required_permission && ! $request->user()?->hasWorkspacePermission($workspace->id, $transition->required_permission)) {
            abort(403, 'Missing workflow transition permission.');
        }

        if ($transition->requires_approval) {
            ApprovalStep::query()->create([
                'ticket_id' => $ticket->id,
                'workflow_transition_id' => $transition->id,
                'requested_transition_to_status' => $transition->to_status,
                'status' => 'pending',
                'requested_by_user_id' => $request->user()?->id,
                'request_reason' => $request->input('reason'),
                'approver_user_id' => $this->resolvedApprover($workspace->id, $transition),
            ]);

            return response()->json([
                'message' => 'Approval requested before transition.',
            ], 202);
        }

        $from = $ticket->status;
        $ticket->update([
            'status' => $transition->to_status,
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'workflow.transition.applied',
            resourceType: Ticket::class,
            resourceId: (string) $ticket->id,
            meta: ['from' => $from, 'to' => $transition->to_status],
            request: $request
        );

        return response()->json([
            'data' => $ticket->fresh(),
        ]);
    }

    public function simulate(Request $request, Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $toStatus = (string) $request->validate([
            'to_status' => ['required', 'string', 'max:40'],
        ])['to_status'];

        $workflow = TicketWorkflow::query()
            ->where('workspace_id', $workspace->id)
            ->where('is_default', true)
            ->with('transitions')
            ->first();

        abort_if(! $workflow, 422, 'No default workflow configured.');

        $transition = $workflow->transitions
            ->where('from_status', $ticket->status)
            ->where('to_status', $toStatus)
            ->first();

        if (! $transition) {
            return response()->json([
                'data' => [
                    'allowed' => false,
                    'reason' => 'Transition is not defined in the active workflow.',
                    'requires_approval' => false,
                ],
            ]);
        }

        $actor = $request->user();
        $missingPermission = $transition->required_permission
            && ! $actor?->hasWorkspacePermission($workspace->id, $transition->required_permission);

        return response()->json([
            'data' => [
                'allowed' => ! $missingPermission,
                'reason' => $missingPermission ? 'Missing required permission for transition.' : null,
                'requires_approval' => (bool) $transition->requires_approval,
                'required_permission' => $transition->required_permission,
                'approver_mode' => $transition->approver_mode,
                'approval_timeout_minutes' => $transition->approval_timeout_minutes,
            ],
        ]);
    }

    private function resolvedApprover(int $workspaceId, WorkflowTransition $transition): ?int
    {
        if (! $transition->requires_approval) {
            return null;
        }

        if ($transition->approver_mode === 'users' && is_array($transition->approver_user_ids_json) && count($transition->approver_user_ids_json) > 0) {
            return (int) $transition->approver_user_ids_json[0];
        }

        if ($transition->approver_mode === 'role' && $transition->approver_role_slug) {
            $userId = DB::table('workspace_membership_roles')
                ->join('workspace_memberships', 'workspace_memberships.id', '=', 'workspace_membership_roles.workspace_membership_id')
                ->join('workspace_roles', 'workspace_roles.id', '=', 'workspace_membership_roles.workspace_role_id')
                ->where('workspace_memberships.workspace_id', $workspaceId)
                ->where('workspace_roles.slug', $transition->approver_role_slug)
                ->orderBy('workspace_memberships.id')
                ->value('workspace_memberships.user_id');

            return $userId ? (int) $userId : null;
        }

        return null;
    }
}
