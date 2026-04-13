<?php

namespace App\Services\Webhooks;

use App\Models\WebhookDelivery;
use Illuminate\Support\Facades\Http;

class WebhookDeliveryProcessor
{
    public function process(WebhookDelivery $delivery): WebhookDelivery
    {
        $delivery->loadMissing(['endpoint', 'event']);

        if ($delivery->status === 'delivered') {
            return $delivery;
        }

        $endpoint = $delivery->endpoint;
        $event = $delivery->event;
        $payload = (string) $event->payload_json;
        $secret = $endpoint->secret_hash;
        $signature = hash_hmac('sha256', $payload, $secret);

        $delivery->attempt_count++;

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Ticketing-Event' => $event->event_type,
                    'X-Ticketing-Signature' => $signature,
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint->url, json_decode($payload, true, 512, JSON_THROW_ON_ERROR));

            if ($response->successful()) {
                $delivery->forceFill([
                    'status' => 'delivered',
                    'response_status' => $response->status(),
                    'response_body' => $response->body(),
                    'delivered_at' => now(),
                    'next_attempt_at' => null,
                ])->save();

                return $delivery;
            }

            $delivery->forceFill([
                'status' => $delivery->attempt_count >= 5 ? 'failed' : 'retrying',
                'response_status' => $response->status(),
                'response_body' => $response->body(),
                'next_attempt_at' => $delivery->attempt_count >= 5 ? null : now()->addMinutes($delivery->attempt_count),
            ])->save();
        } catch (\Throwable $exception) {
            $delivery->forceFill([
                'status' => $delivery->attempt_count >= 5 ? 'failed' : 'retrying',
                'response_body' => $exception->getMessage(),
                'next_attempt_at' => $delivery->attempt_count >= 5 ? null : now()->addMinutes($delivery->attempt_count),
            ])->save();
        }

        return $delivery;
    }
}
