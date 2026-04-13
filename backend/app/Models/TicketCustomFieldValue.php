<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketCustomFieldValue extends Model
{
    protected $fillable = [
        'workspace_id',
        'ticket_id',
        'ticket_custom_field_id',
        'value_json',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'value_json' => 'array',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(TicketCustomField::class, 'ticket_custom_field_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
