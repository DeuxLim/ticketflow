<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Models\WorkspaceNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceNotificationController extends Controller
{
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        $notifications = WorkspaceNotification::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $request->user()->id)
            ->with('ticket:id,ticket_number,title,status,priority')
            ->latest('id')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $notifications->map(fn (WorkspaceNotification $notification) => $this->payload($notification))->values(),
            'meta' => [
                'unread_count' => WorkspaceNotification::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('user_id', $request->user()->id)
                    ->whereNull('read_at')
                    ->count(),
            ],
        ]);
    }

    public function markRead(Request $request, Workspace $workspace, WorkspaceNotification $notification): JsonResponse
    {
        abort_if($notification->workspace_id !== $workspace->id || $notification->user_id !== $request->user()->id, 404);

        if ($notification->read_at === null) {
            $notification->forceFill(['read_at' => now()])->save();
        }

        return response()->json([
            'data' => $this->payload($notification->fresh()->load('ticket:id,ticket_number,title,status,priority')),
        ]);
    }

    public function markAllRead(Request $request, Workspace $workspace): JsonResponse
    {
        WorkspaceNotification::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marked as read.',
        ]);
    }

    private function payload(WorkspaceNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'workspace_id' => $notification->workspace_id,
            'user_id' => $notification->user_id,
            'ticket_id' => $notification->ticket_id,
            'type' => $notification->type,
            'title' => $notification->title,
            'body' => $notification->body,
            'data' => $notification->data ?? [],
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at,
            'ticket' => $notification->ticket ? [
                'id' => $notification->ticket->id,
                'ticket_number' => $notification->ticket->ticket_number,
                'title' => $notification->ticket->title,
                'status' => $notification->ticket->status,
                'priority' => $notification->ticket->priority,
            ] : null,
        ];
    }
}
