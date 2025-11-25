<?php

namespace App\Services\Notifications;

use App\Models\Ticket;
use App\Models\WorkspaceNotification;
use Illuminate\Support\Facades\DB;

class WorkspaceNotificationService
{
    public function notifyTicketAssignee(Ticket $ticket, ?int $actorUserId, string $title, string $body, string $type, array $data = []): void
    {
        if ($ticket->assigned_to_user_id === null || $ticket->assigned_to_user_id === $actorUserId) {
            return;
        }

        $this->notifyUser($ticket, $ticket->assigned_to_user_id, $type, $title, $body, $data);
    }

    public function notifyTicketStakeholders(Ticket $ticket, ?int $actorUserId, string $title, string $body, string $type, array $data = []): void
    {
        $userIds = collect([
            $ticket->created_by_user_id,
            $ticket->assigned_to_user_id,
        ])
            ->merge($ticket->watchers()->pluck('user_id'))
            ->filter(fn ($userId) => $userId !== null && $userId !== $actorUserId)
            ->unique()
            ->values();

        foreach ($userIds as $userId) {
            $this->notifyUser($ticket, (int) $userId, $type, $title, $body, $data);
        }
    }

    private function notifyUser(Ticket $ticket, int $userId, string $type, string $title, string $body, array $data): void
    {
        $isWorkspaceMember = DB::table('workspace_memberships')
            ->where('workspace_id', $ticket->workspace_id)
            ->where('user_id', $userId)
            ->exists();

        if (! $isWorkspaceMember) {
            return;
        }

        WorkspaceNotification::query()->create([
            'workspace_id' => $ticket->workspace_id,
            'user_id' => $userId,
            'ticket_id' => $ticket->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => array_merge($data, [
                'ticket_number' => $ticket->ticket_number,
            ]),
        ]);
    }
}
