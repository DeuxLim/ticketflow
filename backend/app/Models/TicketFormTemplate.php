<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketFormTemplate extends Model
{
    protected $fillable = [
        'workspace_id',
        'ticket_type_id',
        'name',
        'field_schema_json',
        'visibility_rules_json',
        'required_rules_json',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'field_schema_json' => 'array',
            'visibility_rules_json' => 'array',
            'required_rules_json' => 'array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }
}
