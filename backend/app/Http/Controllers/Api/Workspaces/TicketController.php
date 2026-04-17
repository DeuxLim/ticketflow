<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\BulkUpdateTicketsRequest;
use App\Http\Requests\Workspaces\StoreTicketRequest;
use App\Http\Requests\Workspaces\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\ActivityLog;
use App\Models\ApprovalStep;
use App\Models\AutomationExecution;
use App\Models\SlaBreachEvent;
use App\Models\Ticket;
use App\Models\TicketCustomField;
use App\Models\TicketCustomFieldValue;
use App\Models\TicketQueue;
use App\Models\TicketWorkflow;
use App\Models\Workspace;
use App\Services\Sla\SlaEngine;
use App\Services\Tickets\AssignmentStrategyService;
use App\Services\Webhooks\AutomationEngine;
use App\Services\Webhooks\IntegrationEventPublisher;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    public function __construct(
        private readonly SlaEngine $slaEngine,
        private readonly AssignmentStrategyService $assignmentStrategyService,
        private readonly AutomationEngine $automationEngine,
        private readonly IntegrationEventPublisher $integrationEventPublisher
    ) {
    }

    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        $query = Ticket::query()
            ->where('workspace_id', $workspace->id)
            ->with([
                'customer:id,name,email',
                'creator:id,first_name,last_name,email',
                'assignee:id,first_name,last_name,email',
            ]);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('ticket_number', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($priority = $request->string('priority')->toString()) {
            $query->where('priority', $priority);
        }

        if ($queueKey = $request->string('queue_key')->toString()) {
            $query->where('queue_key', $queueKey);
        }

        if ($category = $request->string('category')->toString()) {
            $query->where('category', $category);
        }

        if ($assigneeId = $request->integer('assignee_id')) {
            $query->where('assigned_to_user_id', $assigneeId);
        }

        if ($customerId = $request->integer('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        $perPage = min(max($request->integer('per_page', 15), 1), 200);
        $tickets = $query->latest('id')->paginate($perPage);

        return response()->json([
            'data' => TicketResource::collection($tickets->items()),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    public function store(StoreTicketRequest $request, Workspace $workspace): JsonResponse
    {
        $ticket = DB::transaction(function () use ($request, $workspace): Ticket {
            $setting = $workspace->setting()->first();
            $numberFormat = $setting?->ticket_number_format ?: 'TKT-{seq:6}';
            $nextNumber = $this->nextTicketNumber($workspace->id, $numberFormat);

            $assigneeId = $request->input('assigned_to_user_id');
            if ($assigneeId === null && $setting && $setting->assignment_strategy !== 'manual') {
                $assigneeId = $this->assignmentStrategyService->resolveAssigneeId($workspace, (string) $setting->assignment_strategy);
            }

            $queueKey = $request->input('queue_key');
            if (! $queueKey) {
                $defaultQueue = TicketQueue::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('is_default', true)
                    ->first();

                $queueKey = $defaultQueue?->key;
            }

            $ticket = Ticket::query()->create([
                'workspace_id' => $workspace->id,
                'customer_id' => (int) $request->input('customer_id'),
                'created_by_user_id' => $request->user()->id,
                'assigned_to_user_id' => $assigneeId,
                'ticket_number' => $nextNumber,
                'title' => $request->string('title')->toString(),
                'description' => $request->string('description')->toString(),
                'status' => $request->input('status', 'open'),
                'priority' => $request->string('priority')->toString(),
                'queue_key' => $queueKey,
                'category' => $request->input('category'),
                'tags' => $request->filled('tags') ? implode(',', (array) $request->input('tags', [])) : null,
            ]);

            ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.created', $ticket);

            if ($ticket->assigned_to_user_id !== null) {
                ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.assignee_changed', $ticket, [
                    'from' => null,
                    'to' => $ticket->assigned_to_user_id,
                ]);
            }

            $this->slaEngine->applyPolicy($ticket);
            $this->syncCustomFields($workspace, $ticket, $request->input('custom_fields', []), $request->user()->id);
            $this->automationEngine->apply($workspace, 'ticket.created', $ticket, [
                'actor_user_id' => $request->user()->id,
            ]);
            $breaches = $this->slaEngine->recordBreachesIfNeeded($ticket);
            if ($breaches !== []) {
                $this->automationEngine->apply($workspace, 'ticket.sla.breached', $ticket, [
                    'actor_user_id' => $request->user()->id,
                ]);
            }

            return $ticket;
        });

        $this->integrationEventPublisher->publish($workspace, 'ticket.created', [
            'ticket_id' => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
            'status' => $ticket->status,
            'priority' => $ticket->priority,
        ]);

        return response()->json([
            'data' => new TicketResource($ticket->load(['customer:id,name,email', 'creator:id,first_name,last_name,email', 'assignee:id,first_name,last_name,email'])),
        ], 201);
    }

    public function show(Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $ticket->load([
            'customer:id,name,email',
            'creator:id,first_name,last_name,email',
            'assignee:id,first_name,last_name,email',
            'watchers.user:id,first_name,last_name,email',
            'relatedTickets.relatedTicket:id,workspace_id,ticket_number,title,status,priority',
            'checklistItems' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
            'checklistItems.assignee:id,first_name,last_name,email',
            'customFieldValues.field',
            'approvals',
            'automationExecutions' => fn ($query) => $query->latest('executed_at')->limit(10),
            'slaBreachEvents',
        ]);

        $workflowTransitions = TicketWorkflow::query()
            ->where('workspace_id', $workspace->id)
            ->where('is_default', true)
            ->where('is_active', true)
            ->with(['transitions' => fn ($query) => $query->where('from_status', $ticket->status)->orderBy('sort_order')->orderBy('id')])
            ->first()
            ?->transitions
            ?? collect();

        return response()->json([
            'data' => (new TicketResource($ticket))->additional([
                'workflow_transitions' => $workflowTransitions,
                'assignment_strategy' => $workspace->setting()->first()?->assignment_strategy ?? 'manual',
            ]),
        ]);
    }

    public function update(UpdateTicketRequest $request, Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $originalStatus = $ticket->status;
        $originalAssignee = $ticket->assigned_to_user_id;

        $validated = $request->validated();
        if (array_key_exists('tags', $validated)) {
            $validated['tags'] = $validated['tags'] !== null ? implode(',', (array) $validated['tags']) : null;
        }
        $customFields = $validated['custom_fields'] ?? null;
        unset($validated['custom_fields']);

        $ticket->fill($validated);
        $ticket->save();

        if ($customFields !== null) {
            $this->syncCustomFields($workspace, $ticket, $customFields, $request->user()->id);
        }

        ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.updated', $ticket);

        if ($ticket->status !== $originalStatus) {
            ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.status_changed', $ticket, [
                'from' => $originalStatus,
                'to' => $ticket->status,
            ]);
        }

        if ($ticket->assigned_to_user_id !== $originalAssignee) {
            ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.assignee_changed', $ticket, [
                'from' => $originalAssignee,
                'to' => $ticket->assigned_to_user_id,
            ]);
        }

        $this->slaEngine->markResolvedIfNeeded($ticket);
        $this->automationEngine->apply($workspace, 'ticket.updated', $ticket, [
            'actor_user_id' => $request->user()?->id,
        ]);
        $breaches = $this->slaEngine->recordBreachesIfNeeded($ticket);
        if ($breaches !== []) {
            $this->automationEngine->apply($workspace, 'ticket.sla.breached', $ticket, [
                'actor_user_id' => $request->user()?->id,
            ]);
        }

        $this->integrationEventPublisher->publish($workspace, 'ticket.updated', [
            'ticket_id' => $ticket->id,
            'status' => $ticket->status,
            'priority' => $ticket->priority,
            'assigned_to_user_id' => $ticket->assigned_to_user_id,
        ]);

        return response()->json([
            'data' => new TicketResource($ticket->fresh()->load(['customer:id,name,email', 'creator:id,first_name,last_name,email', 'assignee:id,first_name,last_name,email'])),
        ]);
    }

    public function activity(Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $logs = ActivityLog::query()
            ->where('workspace_id', $workspace->id)
            ->with('user:id,first_name,last_name,email')
            ->where(function ($query) use ($ticket): void {
                $query->where(function ($inner) use ($ticket): void {
                    $inner->where('subject_type', Ticket::class)
                        ->where('subject_id', $ticket->id);
                })->orWhere(function ($inner) use ($ticket): void {
                    $inner->where('action', 'ticket.comment_added')
                        ->where('meta', 'like', '%"ticket_id":'.$ticket->id.'%');
                });
            })
            ->orderBy('id')
            ->get();

        $activity = $logs->map(function (ActivityLog $log): array {
                $meta = null;
                if (is_string($log->meta) && $log->meta !== '') {
                    $decoded = json_decode($log->meta, true);
                    $meta = is_array($decoded) ? $decoded : null;
                }

                return [
                    'id' => $log->id,
                    'workspace_id' => $log->workspace_id,
                    'user_id' => $log->user_id,
                    'action' => $log->action,
                    'subject_type' => $log->subject_type,
                    'subject_id' => $log->subject_id,
                    'meta' => $meta,
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'first_name' => $log->user->first_name,
                        'last_name' => $log->user->last_name,
                        'email' => $log->user->email,
                    ] : null,
                    'created_at' => $log->created_at,
                ];
            });

        $automationEvents = AutomationExecution::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->latest('executed_at')
            ->limit(20)
            ->get()
            ->map(fn (AutomationExecution $execution) => [
                'id' => 'automation-'.$execution->id,
                'workspace_id' => $execution->workspace_id,
                'user_id' => null,
                'action' => 'automation.execution_'.$execution->status,
                'subject_type' => AutomationExecution::class,
                'subject_id' => $execution->id,
                'meta' => [
                    'event_type' => $execution->event_type,
                    'automation_rule_id' => $execution->automation_rule_id,
                    'error_message' => $execution->error_message,
                ],
                'user' => null,
                'created_at' => $execution->executed_at,
            ]);

        $approvalEvents = ApprovalStep::query()
            ->where('ticket_id', $ticket->id)
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (ApprovalStep $approval) => [
                'id' => 'approval-'.$approval->id,
                'workspace_id' => $workspace->id,
                'user_id' => $approval->requested_by_user_id,
                'action' => 'approval.'.$approval->status,
                'subject_type' => ApprovalStep::class,
                'subject_id' => $approval->id,
                'meta' => [
                    'requested_transition_to_status' => $approval->requested_transition_to_status,
                    'decision_reason' => $approval->decision_reason,
                ],
                'user' => null,
                'created_at' => $approval->decisioned_at ?? $approval->created_at,
            ]);

        $slaEvents = SlaBreachEvent::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->latest('breached_at')
            ->limit(20)
            ->get()
            ->map(fn (SlaBreachEvent $event) => [
                'id' => 'sla-'.$event->id,
                'workspace_id' => $event->workspace_id,
                'user_id' => null,
                'action' => 'sla.'.$event->metric_type.'_breached',
                'subject_type' => SlaBreachEvent::class,
                'subject_id' => $event->id,
                'meta' => [
                    'metric_type' => $event->metric_type,
                ],
                'user' => null,
                'created_at' => $event->breached_at,
            ]);

        $merged = $activity
            ->concat($automationEvents)
            ->concat($approvalEvents)
            ->concat($slaEvents)
            ->sortBy(fn (array $event) => (string) $event['created_at'])
            ->values();

        return response()->json([
            'data' => $merged,
            'meta' => [
                'total' => $merged->count(),
            ],
        ]);
    }

    public function bulkUpdate(BulkUpdateTicketsRequest $request, Workspace $workspace): JsonResponse
    {
        $ticketIds = collect($request->input('ticket_ids', []))->map(fn ($id) => (int) $id)->values();

        $updates = array_filter([
            'status' => $request->input('status'),
            'priority' => $request->input('priority'),
            'assigned_to_user_id' => $request->exists('assigned_to_user_id') ? $request->input('assigned_to_user_id') : null,
        ], fn ($value, $key) => $key === 'assigned_to_user_id' ? $request->exists('assigned_to_user_id') : $value !== null, ARRAY_FILTER_USE_BOTH);

        $updatedTickets = [];

        DB::transaction(function () use ($workspace, $request, $ticketIds, $updates, &$updatedTickets): void {
            $tickets = Ticket::query()
                ->where('workspace_id', $workspace->id)
                ->whereIn('id', $ticketIds->all())
                ->get();

            foreach ($tickets as $ticket) {
                $ticket->fill($updates);
                $ticket->save();

                $this->slaEngine->markResolvedIfNeeded($ticket);
                $this->automationEngine->apply($workspace, 'ticket.updated', $ticket, [
                    'actor_user_id' => $request->user()?->id,
                ]);
                $breaches = $this->slaEngine->recordBreachesIfNeeded($ticket);
                if ($breaches !== []) {
                    $this->automationEngine->apply($workspace, 'ticket.sla.breached', $ticket, [
                        'actor_user_id' => $request->user()?->id,
                    ]);
                }

                ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.bulk_updated', $ticket, $updates);

                $this->integrationEventPublisher->publish($workspace, 'ticket.updated', [
                    'ticket_id' => $ticket->id,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'assigned_to_user_id' => $ticket->assigned_to_user_id,
                    'bulk' => true,
                ]);

                $updatedTickets[] = $ticket;
            }
        });

        return response()->json([
            'data' => TicketResource::collection(collect($updatedTickets)),
            'meta' => [
                'updated_count' => count($updatedTickets),
            ],
        ]);
    }

    public function destroy(Request $request, Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $ticketId = $ticket->id;
        $ticketNumber = $ticket->ticket_number;

        $ticket->delete();

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.deleted', null, [
            'ticket_id' => $ticketId,
            'ticket_number' => $ticketNumber,
        ]);

        $this->integrationEventPublisher->publish($workspace, 'ticket.deleted', [
            'ticket_id' => $ticketId,
            'ticket_number' => $ticketNumber,
        ]);

        return response()->json([
            'message' => 'Ticket deleted successfully.',
        ]);
    }

    private function nextTicketNumber(int $workspaceId, string $format): string
    {
        $lastTicket = Ticket::query()
            ->where('workspace_id', $workspaceId)
            ->lockForUpdate()
            ->orderByDesc('id')
            ->first();

        $lastSequence = 0;

        if ($lastTicket) {
            $parts = explode('-', $lastTicket->ticket_number);
            $lastSequence = (int) end($parts);
        }

        $next = $lastSequence + 1;
        $resolved = preg_replace_callback('/\{seq:(\d+)\}/', fn ($match) => str_pad((string) $next, (int) $match[1], '0', STR_PAD_LEFT), $format);

        if (! is_string($resolved) || $resolved === $format) {
            return sprintf('TKT-%06d', $next);
        }

        return $resolved;
    }

    private function syncCustomFields(Workspace $workspace, Ticket $ticket, mixed $customFields, ?int $userId): void
    {
        if (! is_array($customFields) || $customFields === []) {
            return;
        }

        $fields = TicketCustomField::query()
            ->where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->whereIn('key', array_keys($customFields))
            ->get()
            ->keyBy('key');

        foreach ($customFields as $key => $rawValue) {
            $field = $fields->get((string) $key);

            abort_if(! $field, 422, "Unknown custom field [{$key}].");

            TicketCustomFieldValue::query()->updateOrCreate(
                [
                    'ticket_id' => $ticket->id,
                    'ticket_custom_field_id' => $field->id,
                ],
                [
                    'workspace_id' => $workspace->id,
                    'value_json' => ['value' => $rawValue],
                    'updated_by_user_id' => $userId,
                ]
            );
        }
    }
}
