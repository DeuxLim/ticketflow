<?php

namespace App\Services\Sla;

use App\Models\Ticket;
use App\Models\Workspace;
use Illuminate\Support\Carbon;

class ReportingService
{
    public function overview(Workspace $workspace, ?Carbon $from = null, ?Carbon $to = null): array
    {
        $from ??= now()->subDays(30)->startOfDay();
        $to ??= now()->endOfDay();

        $baseQuery = Ticket::query()
            ->where('workspace_id', $workspace->id)
            ->whereBetween('created_at', [$from, $to]);

        $totalTickets = (clone $baseQuery)->count();
        $openTickets = (clone $baseQuery)->whereIn('status', ['open', 'in_progress'])->count();
        $resolvedTickets = (clone $baseQuery)->whereIn('status', ['resolved', 'closed'])->count();

        $responded = (clone $baseQuery)
            ->whereNotNull('first_responded_at')
            ->get(['first_response_due_at', 'first_responded_at']);

        $avgFirstResponseMinutes = (int) round($responded
            ->filter(fn ($ticket) => $ticket->first_responded_at && $ticket->created_at)
            ->avg(fn ($ticket) => $ticket->created_at->diffInMinutes($ticket->first_responded_at)) ?? 0);

        $firstResponseAttained = $responded
            ->filter(fn ($ticket) => $ticket->first_response_due_at !== null)
            ->filter(fn ($ticket) => $ticket->first_responded_at <= $ticket->first_response_due_at)
            ->count();

        $firstResponseEligible = $responded
            ->filter(fn ($ticket) => $ticket->first_response_due_at !== null)
            ->count();

        $slaAttainment = $firstResponseEligible > 0
            ? round(($firstResponseAttained / $firstResponseEligible) * 100, 2)
            : null;

        $backlogByPriority = Ticket::query()
            ->where('workspace_id', $workspace->id)
            ->whereIn('status', ['open', 'in_progress'])
            ->selectRaw('priority, COUNT(*) as total')
            ->groupBy('priority')
            ->pluck('total', 'priority');

        $agentWorkload = Ticket::query()
            ->where('workspace_id', $workspace->id)
            ->whereIn('status', ['open', 'in_progress'])
            ->whereNotNull('assigned_to_user_id')
            ->selectRaw('assigned_to_user_id, COUNT(*) as total')
            ->groupBy('assigned_to_user_id')
            ->with('assignee:id,first_name,last_name,email')
            ->get()
            ->map(fn ($row) => [
                'user_id' => $row->assigned_to_user_id,
                'agent' => $row->assignee ? [
                    'id' => $row->assignee->id,
                    'first_name' => $row->assignee->first_name,
                    'last_name' => $row->assignee->last_name,
                    'email' => $row->assignee->email,
                ] : null,
                'open_tickets' => (int) $row->total,
            ])
            ->values();

        return [
            'window' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
            'totals' => [
                'tickets' => $totalTickets,
                'open' => $openTickets,
                'resolved' => $resolvedTickets,
            ],
            'sla' => [
                'avg_first_response_minutes' => $avgFirstResponseMinutes,
                'first_response_attainment_percent' => $slaAttainment,
            ],
            'backlog_by_priority' => $backlogByPriority,
            'agent_workload' => $agentWorkload,
        ];
    }
}
