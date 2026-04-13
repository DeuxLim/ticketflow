<?php

namespace App\Services\Webhooks;

use App\Models\IntegrationEvent;
use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use App\Models\Workspace;

class IntegrationEventPublisher
{
    public function publish(Workspace $workspace, string $eventType, array $payload): IntegrationEvent
    {
        $event = IntegrationEvent::query()->create([
            'workspace_id' => $workspace->id,
            'event_type' => $eventType,
            'payload_json' => json_encode($payload, JSON_THROW_ON_ERROR),
            'occurred_at' => now(),
        ]);

        $endpoints = WebhookEndpoint::query()
            ->where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->get();

        foreach ($endpoints as $endpoint) {
            if (! in_array($eventType, $endpoint->subscribedEvents(), true)) {
                continue;
            }

            WebhookDelivery::query()->create([
                'webhook_endpoint_id' => $endpoint->id,
                'integration_event_id' => $event->id,
                'status' => 'pending',
                'next_attempt_at' => now(),
            ]);
        }

        return $event;
    }
}
