<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWorkspaceOperationsController extends Controller
{
    public function suspend(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
            'confirmed' => ['required', 'accepted'],
        ]);

        $workspace->update([
            'lifecycle_status' => 'suspended',
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'admin.workspace.suspended',
            resourceType: Workspace::class,
            resourceId: (string) $workspace->id,
            meta: ['reason' => $request->input('reason')],
            request: $request
        );

        return response()->json(['data' => $workspace->fresh()]);
    }

    public function reactivate(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $workspace->update([
            'lifecycle_status' => 'active',
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'admin.workspace.reactivated',
            resourceType: Workspace::class,
            resourceId: (string) $workspace->id,
            meta: ['reason' => $request->input('reason')],
            request: $request
        );

        return response()->json(['data' => $workspace->fresh()]);
    }

    public function updateLimits(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'limits' => ['required', 'array'],
        ]);

        $workspace->update([
            'usage_limits_json' => $validated['limits'],
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'admin.workspace.limits.updated',
            resourceType: Workspace::class,
            resourceId: (string) $workspace->id,
            meta: ['limits' => $validated['limits']],
            request: $request
        );

        return response()->json(['data' => $workspace->fresh()]);
    }

    public function updateFeatureFlags(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'feature_flags' => ['required', 'array'],
        ]);

        $workspace->update([
            'feature_flags' => $validated['feature_flags'],
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'admin.workspace.feature_flags.updated',
            resourceType: Workspace::class,
            resourceId: (string) $workspace->id,
            meta: ['feature_flags' => $validated['feature_flags']],
            request: $request
        );

        return response()->json(['data' => $workspace->fresh()]);
    }

    public function updateIsolation(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'tenant_mode' => ['required', 'in:shared,dedicated'],
            'dedicated_data_plane_key' => ['nullable', 'string', 'max:255'],
            'maintenance_mode' => ['sometimes', 'boolean'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $workspace->update([
            'tenant_mode' => $validated['tenant_mode'],
            'dedicated_data_plane_key' => $validated['dedicated_data_plane_key'] ?? null,
            'maintenance_mode' => $validated['maintenance_mode'] ?? $workspace->maintenance_mode,
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'admin.workspace.isolation.updated',
            resourceType: Workspace::class,
            resourceId: (string) $workspace->id,
            meta: ['tenant_mode' => $workspace->tenant_mode, 'reason' => $validated['reason'] ?? null],
            request: $request
        );

        return response()->json(['data' => $workspace->fresh()]);
    }
}
