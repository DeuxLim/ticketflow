<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\TicketQueue;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Workspaces\WorkspaceFoundationBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TicketQueueController extends Controller
{
    public function __construct(private readonly WorkspaceFoundationBootstrapper $bootstrapper)
    {
    }

    public function index(Workspace $workspace): JsonResponse
    {
        $this->bootstrapper->ensureSettingsFoundation($workspace);

        return response()->json([
            'data' => TicketQueue::query()
                ->where('workspace_id', $workspace->id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
        ]);
    }

    public function store(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate($this->rules($workspace));

        $queue = DB::transaction(function () use ($validated, $workspace): TicketQueue {
            if ((bool) ($validated['is_default'] ?? false)) {
                TicketQueue::query()->where('workspace_id', $workspace->id)->update(['is_default' => false]);
            }

            return TicketQueue::query()->create($validated + [
                'workspace_id' => $workspace->id,
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 0,
            ]);
        });

        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.queue.created', TicketQueue::class, (string) $queue->id, ['key' => $queue->key], $request);

        return response()->json(['data' => $queue], 201);
    }

    public function update(Request $request, Workspace $workspace, TicketQueue $queue, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($queue->workspace_id !== $workspace->id, 404);

        $validated = $request->validate($this->rules($workspace, $queue));

        DB::transaction(function () use ($validated, $workspace, $queue): void {
            if ((bool) ($validated['is_default'] ?? false)) {
                TicketQueue::query()
                    ->where('workspace_id', $workspace->id)
                    ->whereKeyNot($queue->id)
                    ->update(['is_default' => false]);
            }

            $queue->fill($validated);
            $queue->save();
        });

        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.queue.updated', TicketQueue::class, (string) $queue->id, ['key' => $queue->key], $request);

        return response()->json(['data' => $queue->fresh()]);
    }

    private function rules(Workspace $workspace, ?TicketQueue $queue = null): array
    {
        $uniqueKey = Rule::unique('ticket_queues', 'key')
            ->where(fn ($query) => $query->where('workspace_id', $workspace->id));

        if ($queue) {
            $uniqueKey->ignore($queue->id);
        }

        return [
            'key' => [$queue ? 'sometimes' : 'required', 'string', 'max:80', 'regex:/^[a-z0-9_-]+$/', $uniqueKey],
            'name' => [$queue ? 'sometimes' : 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
