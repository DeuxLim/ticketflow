<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantSecurityPolicy extends Model
{
    protected $fillable = [
        'workspace_id',
        'require_sso',
        'require_mfa',
        'session_ttl_minutes',
        'ip_allowlist',
    ];

    protected function casts(): array
    {
        return [
            'require_sso' => 'boolean',
            'require_mfa' => 'boolean',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function allowlist(): array
    {
        if (! $this->ip_allowlist) {
            return [];
        }

        return collect(explode(',', $this->ip_allowlist))
            ->map(fn (string $ip): string => trim($ip))
            ->filter()
            ->values()
            ->all();
    }
}
