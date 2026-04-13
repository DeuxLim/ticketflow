<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutomationExecution extends Model
{
    protected $fillable = [
        'workspace_id',
        'automation_rule_id',
        'ticket_id',
        'event_type',
        'idempotency_key',
        'status',
        'decision_json',
        'error_message',
        'chain_depth',
        'executed_at',
    ];

    protected function casts(): array
    {
        return [
            'decision_json' => 'array',
            'executed_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(AutomationRule::class, 'automation_rule_id');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
