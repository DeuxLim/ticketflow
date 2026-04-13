<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = [
        'workspace_id',
        'customer_id',
        'created_by_user_id',
        'assigned_to_user_id',
        'ticket_number',
        'title',
        'description',
        'status',
        'priority',
        'first_response_due_at',
        'resolution_due_at',
        'first_responded_at',
        'resolved_at',
        'queue_key',
        'category',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'first_response_due_at' => 'datetime',
            'resolution_due_at' => 'datetime',
            'first_responded_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(ApprovalStep::class);
    }

    public function watchers(): HasMany
    {
        return $this->hasMany(TicketWatcher::class);
    }

    public function relatedTickets(): HasMany
    {
        return $this->hasMany(TicketRelatedTicket::class);
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(TicketChecklistItem::class);
    }

    public function customFieldValues(): HasMany
    {
        return $this->hasMany(TicketCustomFieldValue::class);
    }

    public function automationExecutions(): HasMany
    {
        return $this->hasMany(AutomationExecution::class);
    }

    public function slaBreachEvents(): HasMany
    {
        return $this->hasMany(SlaBreachEvent::class);
    }
}
