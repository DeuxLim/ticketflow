<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketChecklistItem;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketChecklistItemController extends Controller
{
    public function index(Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $items = TicketChecklistItem::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->with(['assignee:id,first_name,last_name,email', 'completedBy:id,first_name,last_name,email'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $items->map(fn (TicketChecklistItem $item) => $this->payload($item))->values(),
        ]);
    }

    public function store(Request $request, Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $validated = $this->validatedItem($request, $workspace);

        $item = TicketChecklistItem::query()->create([
            ...$validated,
            'workspace_id' => $workspace->id,
            'ticket_id' => $ticket->id,
            'created_by_user_id' => $request->user()?->id,
        ]);

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.checklist_item_created', $ticket, [
            'checklist_item_id' => $item->id,
            'title' => $item->title,
        ]);

        return response()->json([
            'data' => $this->payload($item->load(['assignee:id,first_name,last_name,email', 'completedBy:id,first_name,last_name,email'])),
        ], 201);
    }

    public function update(Request $request, Workspace $workspace, Ticket $ticket, int $checklistItem): JsonResponse
    {
        $item = TicketChecklistItem::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->whereKey($checklistItem)
            ->firstOrFail();

        $validated = $this->validatedItem($request, $workspace, true);

        if (array_key_exists('is_completed', $validated)) {
            $isCompleted = (bool) $validated['is_completed'];
            $validated['completed_by_user_id'] = $isCompleted ? $request->user()?->id : null;
            $validated['completed_at'] = $isCompleted ? now() : null;
        }

        $item->update($validated);

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.checklist_item_updated', $ticket, [
            'checklist_item_id' => $item->id,
            'fields' => array_keys($validated),
        ]);

        return response()->json([
            'data' => $this->payload($item->fresh()->load(['assignee:id,first_name,last_name,email', 'completedBy:id,first_name,last_name,email'])),
        ]);
    }

    public function reorder(Request $request, Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $workspace, $ticket): void {
            foreach ($validated['items'] as $item) {
                TicketChecklistItem::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('ticket_id', $ticket->id)
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order']]);
            }
        });

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.checklist_reordered', $ticket);

        return $this->index($workspace, $ticket);
    }

    public function destroy(Request $request, Workspace $workspace, Ticket $ticket, int $checklistItem): JsonResponse
    {
        $item = TicketChecklistItem::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->whereKey($checklistItem)
            ->firstOrFail();

        $itemId = $item->id;
        $item->delete();

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.checklist_item_deleted', $ticket, [
            'checklist_item_id' => $itemId,
        ]);

        return response()->json(['message' => 'Checklist item deleted.']);
    }

    private function validatedItem(Request $request, Workspace $workspace, bool $partial = false): array
    {
        $validated = $request->validate([
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'assigned_to_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'is_completed' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (array_key_exists('assigned_to_user_id', $validated) && $validated['assigned_to_user_id'] !== null) {
            $isMember = WorkspaceMembership::query()
                ->where('workspace_id', $workspace->id)
                ->where('user_id', (int) $validated['assigned_to_user_id'])
                ->exists();

            abort_unless($isMember, 422, 'Checklist assignee must belong to the active workspace.');
        }

        return $validated;
    }

    private function payload(TicketChecklistItem $item): array
    {
        return [
            'id' => $item->id,
            'workspace_id' => $item->workspace_id,
            'ticket_id' => $item->ticket_id,
            'title' => $item->title,
            'description' => $item->description,
            'assigned_to_user_id' => $item->assigned_to_user_id,
            'is_completed' => $item->is_completed,
            'completed_by_user_id' => $item->completed_by_user_id,
            'completed_at' => $item->completed_at,
            'sort_order' => $item->sort_order,
            'assignee' => $item->assignee ? [
                'id' => $item->assignee->id,
                'first_name' => $item->assignee->first_name,
                'last_name' => $item->assignee->last_name,
                'email' => $item->assignee->email,
            ] : null,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
}
