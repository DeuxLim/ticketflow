<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketRelatedTicket;
use App\Models\Workspace;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketRelatedTicketController extends Controller
{
    public function index(Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $links = TicketRelatedTicket::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->with('relatedTicket:id,workspace_id,ticket_number,title,status,priority')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $links->map(fn (TicketRelatedTicket $link) => $this->payload($link))->values(),
        ]);
    }

    public function store(Request $request, Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'related_ticket_id' => ['required', 'integer', 'exists:tickets,id'],
            'relationship_type' => ['nullable', 'string', 'max:40'],
        ]);

        $related = Ticket::query()->whereKey((int) $validated['related_ticket_id'])->firstOrFail();

        abort_if($related->id === $ticket->id, 422, 'A ticket cannot be related to itself.');
        abort_if($related->workspace_id !== $workspace->id, 422, 'Related ticket must belong to the active workspace.');

        $link = TicketRelatedTicket::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'ticket_id' => $ticket->id,
                'related_ticket_id' => $related->id,
            ],
            [
                'relationship_type' => $validated['relationship_type'] ?? 'related',
                'created_by_user_id' => $request->user()?->id,
            ]
        );

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.related_ticket_added', $ticket, [
            'related_ticket_id' => $related->id,
            'relationship_type' => $link->relationship_type,
        ]);

        return response()->json([
            'data' => $this->payload($link->load('relatedTicket:id,workspace_id,ticket_number,title,status,priority')),
        ], 201);
    }

    public function destroy(Request $request, Workspace $workspace, Ticket $ticket, int $relatedTicket): JsonResponse
    {
        $link = TicketRelatedTicket::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->whereKey($relatedTicket)
            ->firstOrFail();

        $linkedTicketId = $link->related_ticket_id;
        $link->delete();

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.related_ticket_removed', $ticket, [
            'related_ticket_id' => $linkedTicketId,
        ]);

        return response()->json(['message' => 'Related ticket removed.']);
    }

    private function payload(TicketRelatedTicket $link): array
    {
        return [
            'id' => $link->id,
            'workspace_id' => $link->workspace_id,
            'ticket_id' => $link->ticket_id,
            'related_ticket_id' => $link->related_ticket_id,
            'relationship_type' => $link->relationship_type,
            'ticket' => $link->relatedTicket ? [
                'id' => $link->relatedTicket->id,
                'ticket_number' => $link->relatedTicket->ticket_number,
                'title' => $link->relatedTicket->title,
                'status' => $link->relatedTicket->status,
                'priority' => $link->relatedTicket->priority,
            ] : null,
            'created_at' => $link->created_at,
        ];
    }
}
