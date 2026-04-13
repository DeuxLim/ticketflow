<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Services\Audit\AuditLogger;
use Illuminate\Database\Eloquent\Model;

class ActivityLogger
{
    public static function log(
        ?int $workspaceId,
        ?int $userId,
        string $action,
        ?Model $subject = null,
        ?array $meta = null
    ): void {
        ActivityLog::query()->create([
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'action' => $action,
            'subject_type' => $subject ? $subject::class : 'system',
            'subject_id' => $subject?->getKey(),
            'meta' => $meta ? json_encode($meta, JSON_THROW_ON_ERROR) : null,
            'created_at' => now(),
        ]);

        app(AuditLogger::class)->log(
            workspaceId: $workspaceId,
            actorUserId: $userId,
            action: $action,
            resourceType: $subject ? $subject::class : 'system',
            resourceId: $subject ? (string) $subject->getKey() : null,
            meta: $meta,
            request: request(),
        );
    }
}
