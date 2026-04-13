<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\BreakGlassRequest;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BreakGlassController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        return response()->json([
            'data' => BreakGlassRequest::query()
                ->where('workspace_id', $workspace->id)
                ->latest('id')
                ->limit(200)
                ->get(),
        ]);
    }

    public function store(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
        ]);

        $item = BreakGlassRequest::query()->create([
            'workspace_id' => $workspace->id,
            'requested_by_user_id' => $request->user()?->id,
            'status' => 'pending',
            'reason' => $validated['reason'],
            'duration_minutes' => $validated['duration_minutes'] ?? 60,
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'break_glass.requested',
            resourceType: BreakGlassRequest::class,
            resourceId: (string) $item->id,
            meta: ['duration_minutes' => $item->duration_minutes],
            request: $request
        );

        return response()->json(['data' => $item], 201);
    }

    public function approve(Request $request, Workspace $workspace, BreakGlassRequest $breakGlass, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($breakGlass->workspace_id !== $workspace->id, 404);
        abort_if($breakGlass->status !== 'pending', 422, 'Request is not pending.');

        $approverId = (int) $request->user()?->id;
        abort_if($approverId === (int) $breakGlass->requested_by_user_id, 422, 'Requester cannot approve own break-glass request.');

        if (! $breakGlass->approver_one_user_id) {
            $breakGlass->approver_one_user_id = $approverId;
        } elseif ((int) $breakGlass->approver_one_user_id !== $approverId && ! $breakGlass->approver_two_user_id) {
            $breakGlass->approver_two_user_id = $approverId;
        }

        if ($breakGlass->approver_one_user_id && $breakGlass->approver_two_user_id) {
            $breakGlass->status = 'approved';
            $breakGlass->approved_at = now();
            $breakGlass->expires_at = now()->addMinutes((int) $breakGlass->duration_minutes);
        }

        $breakGlass->save();

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'break_glass.approval_recorded',
            resourceType: BreakGlassRequest::class,
            resourceId: (string) $breakGlass->id,
            meta: ['status' => $breakGlass->status],
            request: $request
        );

        return response()->json(['data' => $breakGlass->fresh()]);
    }
}
