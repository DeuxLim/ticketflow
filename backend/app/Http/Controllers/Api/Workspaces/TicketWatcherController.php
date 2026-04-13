<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketWatcher;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketWatcherController extends Controller
{
    public function index(Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $watchers = TicketWatcher::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->with('user:id,first_name,last_name,email')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $watchers->map(fn (TicketWatcher $watcher) => $this->payload($watcher))->values(),
        ]);
    }

    public function store(Request $request, Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $userId = (int) ($validated['user_id'] ?? $request->user()->id);
        $isSelf = $userId === $request->user()->id;
        $canManage = $request->user()->hasWorkspacePermission($workspace->id, 'tickets.manage');

        abort_unless($isSelf || $canManage, 403, 'Only ticket managers can add other watchers.');

        $isMember = WorkspaceMembership::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $userId)
            ->exists();

        abort_unless($isMember, 422, 'Watcher must belong to the active workspace.');

        $watcher = TicketWatcher::query()->firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
            ],
            [
                'added_by_user_id' => $request->user()->id,
            ]
        );

        ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.watcher_added', $ticket, [
            'user_id' => $userId,
        ]);

        return response()->json([
            'data' => $this->payload($watcher->load('user:id,first_name,last_name,email')),
        ], 201);
    }

    public function destroy(Request $request, Workspace $workspace, Ticket $ticket, int $watcher): JsonResponse
    {
        $record = TicketWatcher::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->whereKey($watcher)
            ->firstOrFail();

        $isSelf = $record->user_id === $request->user()->id;
        $canManage = $request->user()->hasWorkspacePermission($workspace->id, 'tickets.manage');

        abort_unless($isSelf || $canManage, 403, 'Only ticket managers can remove other watchers.');

        $userId = $record->user_id;
        $record->delete();

        ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.watcher_removed', $ticket, [
            'user_id' => $userId,
        ]);

        return response()->json(['message' => 'Watcher removed.']);
    }

    private function payload(TicketWatcher $watcher): array
    {
        return [
            'id' => $watcher->id,
            'workspace_id' => $watcher->workspace_id,
            'ticket_id' => $watcher->ticket_id,
            'user_id' => $watcher->user_id,
            'added_by_user_id' => $watcher->added_by_user_id,
            'user' => $watcher->user ? [
                'id' => $watcher->user->id,
                'first_name' => $watcher->user->first_name,
                'last_name' => $watcher->user->last_name,
                'email' => $watcher->user->email,
            ] : null,
            'created_at' => $watcher->created_at,
        ];
    }
}
