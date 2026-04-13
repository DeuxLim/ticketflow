<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalStep extends Model
{
    protected $fillable = [
        'ticket_id',
        'workflow_transition_id',
        'requested_transition_to_status',
        'status',
        'request_reason',
        'decision_reason',
        'requested_by_user_id',
        'approver_user_id',
        'decisioned_by_user_id',
        'approved_at',
        'rejected_at',
        'decisioned_at',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'decisioned_at' => 'datetime',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function transition(): BelongsTo
    {
        return $this->belongsTo(WorkflowTransition::class, 'workflow_transition_id');
    }
}
