<?php

namespace App\Services\Tickets;

use App\Models\Ticket;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class AssignmentStrategyService
{
    public function resolveAssigneeId(Workspace $workspace, string $strategy): ?int
    {
        if ($strategy === 'manual') {
            return null;
        }

        if ($strategy === 'round_robin') {
            return $this->roundRobinAssignee($workspace->id);
        }

        if ($strategy === 'least_open_load') {
            return $this->leastOpenLoadAssignee($workspace->id);
        }

        return null;
    }

    private function roundRobinAssignee(int $workspaceId): ?int
    {
        $members = DB::table('workspace_memberships')
            ->where('workspace_id', $workspaceId)
            ->orderBy('id')
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($members->isEmpty()) {
            return null;
        }

        $lastTicket = Ticket::query()
            ->where('workspace_id', $workspaceId)
            ->whereNotNull('assigned_to_user_id')
            ->latest('id')
            ->first();

        if (! $lastTicket) {
            return $members->first();
        }

        $lastIndex = $members->search((int) $lastTicket->assigned_to_user_id);
        if ($lastIndex === false) {
            return $members->first();
        }

        return $members[($lastIndex + 1) % $members->count()];
    }

    private function leastOpenLoadAssignee(int $workspaceId): ?int
    {
        $members = DB::table('workspace_memberships')
            ->where('workspace_id', $workspaceId)
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($members->isEmpty()) {
            return null;
        }

        $counts = Ticket::query()
            ->selectRaw('assigned_to_user_id, COUNT(*) as open_count')
            ->where('workspace_id', $workspaceId)
            ->whereIn('status', ['open', 'in_progress'])
            ->whereIn('assigned_to_user_id', $members->all())
            ->groupBy('assigned_to_user_id')
            ->pluck('open_count', 'assigned_to_user_id');

        $target = null;
        $min = PHP_INT_MAX;
        foreach ($members as $userId) {
            $open = (int) ($counts[$userId] ?? 0);
            if ($open < $min) {
                $min = $open;
                $target = $userId;
            }
        }

        return $target;
    }
}
