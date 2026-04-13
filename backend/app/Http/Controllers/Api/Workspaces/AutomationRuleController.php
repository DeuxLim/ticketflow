<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreAutomationRuleRequest;
use App\Models\AutomationExecution;
use App\Models\AutomationRule;
use App\Models\Ticket;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Webhooks\AutomationEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutomationRuleController extends Controller
{
    public function __construct(private readonly AutomationEngine $automationEngine)
    {
    }

    public function index(Workspace $workspace): JsonResponse
    {
        return response()->json([
            'data' => AutomationRule::query()
                ->where('workspace_id', $workspace->id)
                ->orderBy('priority')
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(StoreAutomationRuleRequest $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $rule = AutomationRule::query()->create([
            'workspace_id' => $workspace->id,
            'name' => $request->string('name')->toString(),
            'event_type' => $request->string('event_type')->toString(),
            'priority' => (int) $request->input('priority', 100),
            'schema_version' => 2,
            'max_chain_depth' => (int) $request->input('max_chain_depth', 3),
            'idempotency_scope' => (string) $request->input('idempotency_scope', 'rule_event_ticket'),
            'condition_json' => json_encode($request->input('conditions', []), JSON_THROW_ON_ERROR),
            'action_json' => json_encode($request->input('actions', []), JSON_THROW_ON_ERROR),
            'is_active' => $request->boolean('is_active', true),
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'automation.rule.created',
            resourceType: AutomationRule::class,
            resourceId: (string) $rule->id,
            meta: ['name' => $rule->name, 'event_type' => $rule->event_type],
            request: $request
        );

        return response()->json(['data' => $rule], 201);
    }

    public function update(Request $request, Workspace $workspace, AutomationRule $rule, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($rule->workspace_id !== $workspace->id, 404);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'event_type' => ['sometimes', 'string', 'max:120'],
            'conditions' => ['sometimes', 'array'],
            'actions' => ['sometimes', 'array', 'min:1'],
            'priority' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'max_chain_depth' => ['sometimes', 'integer', 'min:0', 'max:10'],
            'idempotency_scope' => ['sometimes', 'string', 'max:80'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('conditions', $validated)) {
            $validated['condition_json'] = json_encode($validated['conditions'], JSON_THROW_ON_ERROR);
            unset($validated['conditions']);
        }

        if (array_key_exists('actions', $validated)) {
            $validated['action_json'] = json_encode($validated['actions'], JSON_THROW_ON_ERROR);
            unset($validated['actions']);
        }

        $rule->fill($validated);
        $rule->save();

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'automation.rule.updated',
            resourceType: AutomationRule::class,
            resourceId: (string) $rule->id,
            meta: ['fields' => array_keys($request->all())],
            request: $request
        );

        return response()->json(['data' => $rule->fresh()]);
    }

    public function toggle(Request $request, Workspace $workspace, AutomationRule $rule, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($rule->workspace_id !== $workspace->id, 404);
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $rule->update(['is_active' => (bool) $validated['is_active']]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'automation.rule.toggled',
            resourceType: AutomationRule::class,
            resourceId: (string) $rule->id,
            meta: ['is_active' => $rule->is_active],
            request: $request
        );

        return response()->json(['data' => $rule->fresh()]);
    }

    public function test(Request $request, Workspace $workspace, AutomationRule $rule): JsonResponse
    {
        abort_if($rule->workspace_id !== $workspace->id, 404);

        $validated = $request->validate([
            'ticket_id' => ['required', 'integer'],
        ]);

        $ticket = Ticket::query()
            ->where('workspace_id', $workspace->id)
            ->whereKey((int) $validated['ticket_id'])
            ->firstOrFail();

        $results = $this->automationEngine->dryRun($workspace, $rule->event_type, $ticket, [
            'actor_user_id' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => collect($results)->firstWhere('rule_id', $rule->id) ?? null,
        ]);
    }

    public function executions(Workspace $workspace): JsonResponse
    {
        $executions = AutomationExecution::query()
            ->where('workspace_id', $workspace->id)
            ->with(['rule:id,name,event_type', 'ticket:id,ticket_number,title'])
            ->latest('id')
            ->limit(200)
            ->get();

        return response()->json([
            'data' => $executions,
        ]);
    }
}
