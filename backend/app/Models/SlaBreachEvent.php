<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SlaBreachEvent extends Model
{
    protected $fillable = [
        'workspace_id',
        'ticket_id',
        'metric_type',
        'breached_at',
    ];

    protected function casts(): array
    {
        return [
            'breached_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
