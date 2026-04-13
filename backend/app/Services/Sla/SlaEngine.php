<?php

namespace App\Services\Sla;

use App\Models\SlaBreachEvent;
use App\Models\SlaPolicy;
use App\Models\Ticket;

class SlaEngine
{
    public function applyPolicy(Ticket $ticket): void
    {
        $policy = SlaPolicy::query()
            ->where('workspace_id', $ticket->workspace_id)
            ->where('is_active', true)
            ->where(function ($query) use ($ticket): void {
                $query->whereNull('priority')->orWhere('priority', $ticket->priority);
            })
            ->orderByRaw('priority IS NULL')
            ->first();

        if (! $policy) {
            return;
        }

        $createdAt = $ticket->created_at ?? now();

        $ticket->forceFill([
            'first_response_due_at' => $createdAt->copy()->addMinutes($policy->first_response_minutes),
            'resolution_due_at' => $createdAt->copy()->addMinutes($policy->resolution_minutes),
        ])->save();
    }

    public function markFirstResponseIfNeeded(Ticket $ticket): void
    {
        if ($ticket->first_responded_at !== null) {
            return;
        }

        $ticket->forceFill([
            'first_responded_at' => now(),
        ])->save();
    }

    public function markResolvedIfNeeded(Ticket $ticket): void
    {
        if (in_array($ticket->status, ['resolved', 'closed'], true) && $ticket->resolved_at === null) {
            $ticket->forceFill(['resolved_at' => now()])->save();
        }
    }

    public function recordBreachesIfNeeded(Ticket $ticket): array
    {
        $breaches = [];

        if ($ticket->first_response_due_at && ! $ticket->first_responded_at && now()->greaterThan($ticket->first_response_due_at)) {
            $event = SlaBreachEvent::query()->firstOrCreate(
                ['ticket_id' => $ticket->id, 'metric_type' => 'first_response'],
                ['workspace_id' => $ticket->workspace_id, 'breached_at' => now()]
            );
            $breaches[] = $event;
        }

        if ($ticket->resolution_due_at && ! $ticket->resolved_at && now()->greaterThan($ticket->resolution_due_at)) {
            $event = SlaBreachEvent::query()->firstOrCreate(
                ['ticket_id' => $ticket->id, 'metric_type' => 'resolution'],
                ['workspace_id' => $ticket->workspace_id, 'breached_at' => now()]
            );
            $breaches[] = $event;
        }

        return $breaches;
    }
}
