<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowTransition extends Model
{
    protected $fillable = [
        'ticket_workflow_id',
        'from_status',
        'to_status',
        'required_permission',
        'requires_approval',
        'sort_order',
        'approver_mode',
        'approver_role_slug',
        'approver_user_ids_json',
        'approval_timeout_minutes',
    ];

    protected function casts(): array
    {
        return [
            'requires_approval' => 'boolean',
            'sort_order' => 'integer',
            'approval_timeout_minutes' => 'integer',
            'approver_user_ids_json' => 'array',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(TicketWorkflow::class, 'ticket_workflow_id');
    }
}
