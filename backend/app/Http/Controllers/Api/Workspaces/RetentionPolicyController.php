<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\RetentionPolicy;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RetentionPolicyController extends Controller
{
    public function show(Workspace $workspace): JsonResponse
    {
        $policy = RetentionPolicy::query()->firstOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'tickets_days' => 365,
                'comments_days' => 365,
                'attachments_days' => 365,
                'audit_days' => 730,
                'purge_enabled' => false,
            ]
        );

        return response()->json(['data' => $policy]);
    }

    public function update(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'tickets_days' => ['sometimes', 'integer', 'min:1', 'max:36500'],
            'comments_days' => ['sometimes', 'integer', 'min:1', 'max:36500'],
            'attachments_days' => ['sometimes', 'integer', 'min:1', 'max:36500'],
            'audit_days' => ['sometimes', 'integer', 'min:1', 'max:36500'],
            'purge_enabled' => ['sometimes', 'boolean'],
        ]);

        $policy = RetentionPolicy::query()->firstOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'tickets_days' => 365,
                'comments_days' => 365,
                'attachments_days' => 365,
                'audit_days' => 730,
                'purge_enabled' => false,
            ]
        );

        $policy->fill($validated);
        $policy->save();

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'retention.policy.updated',
            resourceType: RetentionPolicy::class,
            resourceId: (string) $policy->id,
            meta: ['fields' => array_keys($validated)],
            request: $request
        );

        return response()->json(['data' => $policy->fresh()]);
    }
}
