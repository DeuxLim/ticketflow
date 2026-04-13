<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AutomationRule extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'event_type',
        'priority',
        'schema_version',
        'max_chain_depth',
        'idempotency_scope',
        'condition_json',
        'action_json',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'priority' => 'integer',
            'schema_version' => 'integer',
            'max_chain_depth' => 'integer',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function executions(): HasMany
    {
        return $this->hasMany(AutomationExecution::class);
    }
}
