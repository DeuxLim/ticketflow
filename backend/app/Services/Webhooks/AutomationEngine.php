<?php

namespace App\Services\Webhooks;

use App\Models\ApprovalStep;
use App\Models\AutomationExecution;
use App\Models\AutomationRule;
use App\Models\Ticket;
use App\Models\Workspace;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class AutomationEngine
{
    public function apply(Workspace $workspace, string $eventType, Ticket $ticket, array $context = [], int $chainDepth = 0): array
    {
        $rules = $this->rules($workspace, $eventType);
        $results = [];

        foreach ($rules as $rule) {
            $idempotencyKey = $this->idempotencyKey($rule, $eventType, $ticket);
            $existing = AutomationExecution::query()
                ->where('automation_rule_id', $rule->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing) {
                $results[] = [
                    'rule_id' => $rule->id,
                    'status' => 'skipped',
                    'reason' => 'idempotent',
                ];

                continue;
            }

            try {
                $decision = $this->evaluate($rule, $ticket, $context);

                if (! $decision['matched']) {
                    $this->logExecution($workspace, $rule, $ticket, $eventType, $idempotencyKey, 'skipped', $decision, null, $chainDepth);
                    $results[] = ['rule_id' => $rule->id, 'status' => 'skipped', 'reason' => 'condition_not_matched'];
                    continue;
                }

                if ($decision['updates'] !== []) {
                    $ticket->fill($decision['updates']);
                    $ticket->save();
                }

                if ($decision['request_approval']) {
                    ApprovalStep::query()->create([
                        'ticket_id' => $ticket->id,
                        'status' => 'pending',
                        'requested_by_user_id' => Arr::get($context, 'actor_user_id'),
                        'request_reason' => 'Automation requested approval',
                    ]);
                }

                $this->logExecution($workspace, $rule, $ticket, $eventType, $idempotencyKey, 'applied', $decision, null, $chainDepth);
                $results[] = ['rule_id' => $rule->id, 'status' => 'applied', 'updates' => $decision['updates']];
            } catch (\Throwable $exception) {
                $this->logExecution($workspace, $rule, $ticket, $eventType, $idempotencyKey, 'failed', null, $exception->getMessage(), $chainDepth);
                $results[] = ['rule_id' => $rule->id, 'status' => 'failed', 'error' => $exception->getMessage()];
            }
        }

        return $results;
    }

    public function dryRun(Workspace $workspace, string $eventType, Ticket $ticket, array $context = []): array
    {
        $rules = $this->rules($workspace, $eventType);
        $results = [];

        foreach ($rules as $rule) {
            $decision = $this->evaluate($rule, $ticket, $context);
            $results[] = [
                'rule_id' => $rule->id,
                'rule_name' => $rule->name,
                'matched' => $decision['matched'],
                'updates' => $decision['updates'],
                'request_approval' => $decision['request_approval'],
                'conditions' => $decision['conditions'],
                'actions' => $decision['actions'],
            ];
        }

        return $results;
    }

    private function rules(Workspace $workspace, string $eventType): Collection
    {
        return AutomationRule::query()
            ->where('workspace_id', $workspace->id)
            ->where('event_type', $eventType)
            ->where('is_active', true)
            ->orderBy('priority')
            ->orderBy('id')
            ->get();
    }

    private function evaluate(AutomationRule $rule, Ticket $ticket, array $context): array
    {
        $conditions = $rule->condition_json
            ? json_decode((string) $rule->condition_json, true, 512, JSON_THROW_ON_ERROR)
            : [];
        $actions = $rule->action_json
            ? json_decode((string) $rule->action_json, true, 512, JSON_THROW_ON_ERROR)
            : [];

        $matched = $this->matches($ticket, $conditions);
        $updates = [];
        $requestApproval = false;

        if ($matched) {
            [$updates, $requestApproval] = $this->resolveActions($ticket, $actions, $context);
        }

        return [
            'matched' => $matched,
            'updates' => $updates,
            'request_approval' => $requestApproval,
            'conditions' => $conditions,
            'actions' => $actions,
        ];
    }

    private function resolveActions(Ticket $ticket, array $actions, array $context): array
    {
        $updates = [];
        $requestApproval = false;

        // Backward compatibility: associative payload { status: "in_progress" }
        if (Arr::isAssoc($actions)) {
            foreach ($actions as $field => $value) {
                if (in_array($field, ['status', 'priority', 'assigned_to_user_id', 'queue_key', 'category', 'tags'], true)) {
                    $updates[$field] = is_array($value) ? implode(',', $value) : $value;
                }
            }

            return [$updates, false];
        }

        foreach ($actions as $action) {
            if (! is_array($action)) {
                continue;
            }

            $type = (string) ($action['type'] ?? '');
            if ($type === '') {
                continue;
            }

            if ($type === 'set_field') {
                $field = (string) ($action['field'] ?? '');
                $value = $action['value'] ?? null;
                if (in_array($field, ['status', 'priority', 'assigned_to_user_id', 'queue_key', 'category', 'tags'], true)) {
                    $updates[$field] = is_array($value) ? implode(',', $value) : $value;
                }

                continue;
            }

            if ($type === 'add_tag') {
                $tag = (string) ($action['value'] ?? '');
                if ($tag !== '') {
                    $existing = $ticket->tags ? explode(',', (string) $ticket->tags) : [];
                    $existing[] = $tag;
                    $updates['tags'] = collect($existing)->filter()->unique()->implode(',');
                }

                continue;
            }

            if ($type === 'remove_tag') {
                $tag = (string) ($action['value'] ?? '');
                $existing = $ticket->tags ? explode(',', (string) $ticket->tags) : [];
                $updates['tags'] = collect($existing)->reject(fn ($item) => $item === $tag)->values()->implode(',');
                continue;
            }

            if ($type === 'assign_actor') {
                $actorId = Arr::get($context, 'actor_user_id');
                if ($actorId) {
                    $updates['assigned_to_user_id'] = (int) $actorId;
                }
                continue;
            }

            if ($type === 'request_approval') {
                $requestApproval = true;
            }
        }

        return [$updates, $requestApproval];
    }

    private function matches(Ticket $ticket, array $conditions): bool
    {
        // Backward compatibility: associative conditions { priority: "high" }
        if (Arr::isAssoc($conditions)) {
            foreach ($conditions as $field => $expected) {
                $actual = $ticket->{$field} ?? null;

                if (is_array($expected)) {
                    if (! in_array($actual, $expected, true)) {
                        return false;
                    }

                    continue;
                }

                if ((string) $actual !== (string) $expected) {
                    return false;
                }
            }

            return true;
        }

        foreach ($conditions as $condition) {
            if (! is_array($condition)) {
                continue;
            }

            $field = (string) ($condition['field'] ?? '');
            $operator = (string) ($condition['operator'] ?? 'eq');
            $expected = $condition['value'] ?? null;
            $actual = $ticket->{$field} ?? null;

            if ($operator === 'eq' && (string) $actual !== (string) $expected) {
                return false;
            }

            if ($operator === 'in') {
                $values = is_array($expected) ? $expected : [$expected];
                if (! in_array($actual, $values, true)) {
                    return false;
                }
            }

            if ($operator === 'not_eq' && (string) $actual === (string) $expected) {
                return false;
            }
        }

        return true;
    }

    private function idempotencyKey(AutomationRule $rule, string $eventType, Ticket $ticket): string
    {
        return hash('sha256', implode('|', [$rule->id, $eventType, $ticket->id]));
    }

    private function logExecution(
        Workspace $workspace,
        AutomationRule $rule,
        Ticket $ticket,
        string $eventType,
        string $idempotencyKey,
        string $status,
        ?array $decision,
        ?string $errorMessage,
        int $chainDepth
    ): void {
        AutomationExecution::query()->create([
            'workspace_id' => $workspace->id,
            'automation_rule_id' => $rule->id,
            'ticket_id' => $ticket->id,
            'event_type' => $eventType,
            'idempotency_key' => $idempotencyKey,
            'status' => $status,
            'decision_json' => $decision,
            'error_message' => $errorMessage,
            'chain_depth' => $chainDepth,
            'executed_at' => now(),
        ]);
    }
}
