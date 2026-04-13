<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreSlaPolicyRequest;
use App\Models\SlaPolicy;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;

class SlaPolicyController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        return response()->json([
            'data' => SlaPolicy::query()
                ->where('workspace_id', $workspace->id)
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(StoreSlaPolicyRequest $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $policy = SlaPolicy::query()->create([
            'workspace_id' => $workspace->id,
            'business_calendar_id' => $request->input('business_calendar_id'),
            'name' => $request->string('name')->toString(),
            'priority' => $request->input('priority'),
            'first_response_minutes' => (int) $request->input('first_response_minutes'),
            'resolution_minutes' => (int) $request->input('resolution_minutes'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'sla.policy.created',
            resourceType: SlaPolicy::class,
            resourceId: (string) $policy->id,
            meta: $policy->toArray(),
            request: $request
        );

        return response()->json(['data' => $policy], 201);
    }
}
