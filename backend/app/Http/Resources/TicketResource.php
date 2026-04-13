<?php

namespace App\Http\Resources;

use App\Models\AutomationExecution;
use App\Models\SlaBreachEvent;
use App\Models\TicketChecklistItem;
use App\Models\TicketCustomFieldValue;
use App\Models\TicketRelatedTicket;
use App\Models\TicketWatcher;
use App\Models\WorkflowTransition;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'customer_id' => $this->customer_id,
            'created_by_user_id' => $this->created_by_user_id,
            'assigned_to_user_id' => $this->assigned_to_user_id,
            'ticket_number' => $this->ticket_number,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'first_response_due_at' => $this->first_response_due_at,
            'resolution_due_at' => $this->resolution_due_at,
            'first_responded_at' => $this->first_responded_at,
            'resolved_at' => $this->resolved_at,
            'queue_key' => $this->queue_key,
            'category' => $this->category,
            'tags' => $this->tags ? explode(',', (string) $this->tags) : [],
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'email' => $this->customer?->email,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator?->id,
                'first_name' => $this->creator?->first_name,
                'last_name' => $this->creator?->last_name,
                'email' => $this->creator?->email,
            ]),
            'assignee' => $this->whenLoaded('assignee', fn () => [
                'id' => $this->assignee?->id,
                'first_name' => $this->assignee?->first_name,
                'last_name' => $this->assignee?->last_name,
                'email' => $this->assignee?->email,
            ]),
            'watchers' => $this->whenLoaded('watchers', fn () => $this->watchers->map(fn (TicketWatcher $watcher) => [
                'id' => $watcher->id,
                'user_id' => $watcher->user_id,
                'added_by_user_id' => $watcher->added_by_user_id,
                'user' => $watcher->user ? [
                    'id' => $watcher->user->id,
                    'first_name' => $watcher->user->first_name,
                    'last_name' => $watcher->user->last_name,
                    'email' => $watcher->user->email,
                ] : null,
                'created_at' => $watcher->created_at,
            ])->values()),
            'related_tickets' => $this->whenLoaded('relatedTickets', fn () => $this->relatedTickets->map(fn (TicketRelatedTicket $link) => [
                'id' => $link->id,
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
            ])->values()),
            'checklist_items' => $this->whenLoaded('checklistItems', fn () => $this->checklistItems->map(fn (TicketChecklistItem $item) => [
                'id' => $item->id,
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
            ])->values()),
            'custom_fields' => $this->whenLoaded('customFieldValues', fn () => $this->customFieldValues->map(fn (TicketCustomFieldValue $value) => [
                'id' => $value->id,
                'ticket_custom_field_id' => $value->ticket_custom_field_id,
                'key' => $value->field?->key,
                'label' => $value->field?->label,
                'field_type' => $value->field?->field_type,
                'value' => is_array($value->value_json) && array_key_exists('value', $value->value_json) ? $value->value_json['value'] : null,
                'field' => $value->field ? [
                    'id' => $value->field->id,
                    'key' => $value->field->key,
                    'label' => $value->field->label,
                    'field_type' => $value->field->field_type,
                    'options' => $value->field->options_json ?? [],
                    'is_required' => $value->field->is_required,
                    'sort_order' => $value->field->sort_order,
                ] : null,
                'updated_at' => $value->updated_at,
            ])->values()),
            'state_summary' => $this->when(
                $this->relationLoaded('approvals')
                || $this->relationLoaded('automationExecutions')
                || $this->relationLoaded('slaBreachEvents'),
                fn () => $this->stateSummary()
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function stateSummary(): array
    {
        $now = now();
        $firstResponseBreached = $this->first_response_due_at !== null && $this->first_responded_at === null && $this->first_response_due_at->lt($now);
        $resolutionBreached = $this->resolution_due_at !== null && $this->resolved_at === null && $this->resolution_due_at->lt($now);
        $pendingApprovals = $this->whenLoaded('approvals', fn () => $this->approvals->where('status', 'pending')->count(), 0);
        $latestApproval = $this->whenLoaded('approvals', fn () => $this->approvals->sortByDesc('id')->first(), null);
        $latestExecution = $this->whenLoaded('automationExecutions', fn () => $this->automationExecutions->sortByDesc('executed_at')->first(), null);
        $breaches = $this->whenLoaded('slaBreachEvents', fn () => $this->slaBreachEvents, collect());
        $workflowTransitions = $this->additional['workflow_transitions'] ?? collect();
        $assignmentStrategy = $this->additional['assignment_strategy'] ?? 'manual';

        return [
            'sla' => [
                'status' => ($firstResponseBreached || $resolutionBreached) ? 'breached' : 'on_track',
                'first_response' => [
                    'due_at' => $this->first_response_due_at,
                    'completed_at' => $this->first_responded_at,
                    'is_breached' => $firstResponseBreached,
                ],
                'resolution' => [
                    'due_at' => $this->resolution_due_at,
                    'completed_at' => $this->resolved_at,
                    'is_breached' => $resolutionBreached,
                ],
                'breaches' => $breaches->map(fn (SlaBreachEvent $event) => [
                    'id' => $event->id,
                    'metric_type' => $event->metric_type,
                    'breached_at' => $event->breached_at,
                ])->values(),
            ],
            'approval' => [
                'pending_count' => $pendingApprovals,
                'latest_status' => $latestApproval?->status,
                'requested_transition_to_status' => $latestApproval?->requested_transition_to_status,
            ],
            'workflow' => [
                'current_status' => $this->status,
                'available_transitions' => $workflowTransitions->map(fn (WorkflowTransition $transition) => [
                    'id' => $transition->id,
                    'to_status' => $transition->to_status,
                    'requires_approval' => $transition->requires_approval,
                    'required_permission' => $transition->required_permission,
                ])->values(),
            ],
            'automation' => [
                'recent_count' => $this->whenLoaded('automationExecutions', fn () => $this->automationExecutions->count(), 0),
                'last_event_type' => $latestExecution?->event_type,
                'last_status' => $latestExecution?->status,
                'last_executed_at' => $latestExecution instanceof AutomationExecution ? $latestExecution->executed_at : null,
            ],
            'assignment' => [
                'strategy' => $assignmentStrategy,
                'assignee_id' => $this->assigned_to_user_id,
                'queue_key' => $this->queue_key,
                'category' => $this->category,
            ],
        ];
    }
}
