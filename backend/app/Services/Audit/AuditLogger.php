<?php

namespace App\Services\Audit;

use App\Models\AuditEvent;
use Illuminate\Http\Request;

class AuditLogger
{
    public function log(
        ?int $workspaceId,
        ?int $actorUserId,
        string $action,
        string $resourceType,
        ?string $resourceId = null,
        ?array $meta = null,
        ?Request $request = null
    ): AuditEvent {
        $previous = AuditEvent::query()->latest('id')->first();
        $previousHash = $previous?->event_hash;
        $createdAt = now();

        $payload = [
            'workspace_id' => $workspaceId,
            'actor_user_id' => $actorUserId,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'meta' => $meta,
            'created_at' => $createdAt->toIso8601String(),
            'previous_hash' => $previousHash,
        ];

        $eventHash = hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));

        return AuditEvent::query()->create([
            'workspace_id' => $workspaceId,
            'actor_user_id' => $actorUserId,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'request_id' => $request?->header('X-Request-Id'),
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'meta' => $meta ? json_encode($meta, JSON_THROW_ON_ERROR) : null,
            'previous_hash' => $previousHash,
            'event_hash' => $eventHash,
            'created_at' => $createdAt,
        ]);
    }
}
