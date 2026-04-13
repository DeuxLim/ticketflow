<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    protected $fillable = [
        'webhook_endpoint_id',
        'integration_event_id',
        'attempt_count',
        'status',
        'response_status',
        'response_body',
        'next_attempt_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'next_attempt_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function endpoint(): BelongsTo
    {
        return $this->belongsTo(WebhookEndpoint::class, 'webhook_endpoint_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(IntegrationEvent::class, 'integration_event_id');
    }
}
