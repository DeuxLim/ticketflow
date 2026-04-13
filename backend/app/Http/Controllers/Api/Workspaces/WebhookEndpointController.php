<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreWebhookEndpointRequest;
use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Webhooks\WebhookDeliveryProcessor;
use Illuminate\Http\JsonResponse;

class WebhookEndpointController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        $data = WebhookEndpoint::query()
            ->where('workspace_id', $workspace->id)
            ->latest('id')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function store(StoreWebhookEndpointRequest $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $endpoint = WebhookEndpoint::query()->create([
            'workspace_id' => $workspace->id,
            'name' => $request->string('name')->toString(),
            'url' => $request->string('url')->toString(),
            'secret_hash' => $request->string('secret')->toString(),
            'events' => implode(',', $request->input('events', [])),
            'is_active' => $request->boolean('is_active', true),
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'webhook.endpoint.created',
            resourceType: WebhookEndpoint::class,
            resourceId: (string) $endpoint->id,
            meta: ['events' => $request->input('events', [])],
            request: $request
        );

        return response()->json(['data' => $endpoint], 201);
    }

    public function deliveries(Workspace $workspace): JsonResponse
    {
        $data = WebhookDelivery::query()
            ->whereHas('endpoint', fn ($query) => $query->where('workspace_id', $workspace->id))
            ->with(['endpoint:id,name,url', 'event:id,event_type,occurred_at'])
            ->latest('id')
            ->paginate(25);

        return response()->json([
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'total' => $data->total(),
            ],
        ]);
    }

    public function retry(Workspace $workspace, WebhookDelivery $delivery, WebhookDeliveryProcessor $processor): JsonResponse
    {
        $delivery->load('endpoint');
        abort_if($delivery->endpoint->workspace_id !== $workspace->id, 404);

        $processed = $processor->process($delivery);

        return response()->json([
            'data' => $processed->fresh()->load(['endpoint:id,name,url', 'event:id,event_type,occurred_at']),
        ]);
    }
}
