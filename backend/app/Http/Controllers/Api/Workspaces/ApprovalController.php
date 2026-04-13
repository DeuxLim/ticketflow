<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\ApprovalStep;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        $status = $request->string('status')->toString();

        $query = ApprovalStep::query()
            ->whereHas('ticket', fn ($ticket) => $ticket->where('workspace_id', $workspace->id))
            ->with(['ticket:id,ticket_number,title,status', 'transition:id,from_status,to_status']);

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($request->boolean('mine')) {
            $query->where('approver_user_id', $request->user()?->id);
        }

        return response()->json([
            'data' => $query->latest('id')->get(),
        ]);
    }

    public function approve(Request $request, Workspace $workspace, ApprovalStep $approval, AuditLogger $auditLogger): JsonResponse
    {
        abort_if(! $approval->ticket || $approval->ticket->workspace_id !== $workspace->id, 404);
        abort_if($approval->status !== 'pending', 422, 'Approval is not pending.');

        $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $approval->forceFill([
            'status' => 'approved',
            'approved_at' => now(),
            'decisioned_at' => now(),
            'decision_reason' => $request->input('reason'),
            'decisioned_by_user_id' => $request->user()?->id,
        ])->save();

        $ticket = $approval->ticket;
        if ($approval->requested_transition_to_status) {
            $ticket->update([
                'status' => $approval->requested_transition_to_status,
            ]);
        }

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'approval.approved',
            resourceType: ApprovalStep::class,
            resourceId: (string) $approval->id,
            meta: ['ticket_id' => $ticket->id, 'to_status' => $approval->requested_transition_to_status],
            request: $request
        );

        return response()->json([
            'data' => $approval->fresh(),
        ]);
    }

    public function reject(Request $request, Workspace $workspace, ApprovalStep $approval, AuditLogger $auditLogger): JsonResponse
    {
        abort_if(! $approval->ticket || $approval->ticket->workspace_id !== $workspace->id, 404);
        abort_if($approval->status !== 'pending', 422, 'Approval is not pending.');

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $approval->forceFill([
            'status' => 'rejected',
            'rejected_at' => now(),
            'decisioned_at' => now(),
            'decision_reason' => $validated['reason'],
            'decisioned_by_user_id' => $request->user()?->id,
        ])->save();

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'approval.rejected',
            resourceType: ApprovalStep::class,
            resourceId: (string) $approval->id,
            meta: ['ticket_id' => $approval->ticket_id, 'reason' => $validated['reason']],
            request: $request
        );

        return response()->json([
            'data' => $approval->fresh(),
        ]);
    }
}
