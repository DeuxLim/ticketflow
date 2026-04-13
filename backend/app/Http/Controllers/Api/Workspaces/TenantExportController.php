<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\LegalHold;
use App\Models\TenantExport;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantExportController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        return response()->json([
            'data' => TenantExport::query()
                ->where('workspace_id', $workspace->id)
                ->latest('id')
                ->limit(200)
                ->get(),
        ]);
    }

    public function store(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'include' => ['nullable', 'array'],
            'include.*' => ['string', 'in:tickets,comments,attachments,audit'],
        ]);

        $token = Str::random(40);
        $expiresAt = now()->addHours(24);
        $include = collect($validated['include'] ?? ['tickets', 'comments', 'attachments', 'audit'])->values()->all();

        $result = [
            'counts' => [
                'tickets' => in_array('tickets', $include, true) ? Ticket::query()->where('workspace_id', $workspace->id)->count() : 0,
                'comments' => in_array('comments', $include, true) ? TicketComment::query()->where('workspace_id', $workspace->id)->count() : 0,
                'attachments' => in_array('attachments', $include, true) ? TicketAttachment::query()->where('workspace_id', $workspace->id)->count() : 0,
                'audit' => in_array('audit', $include, true) ? AuditEvent::query()->where('workspace_id', $workspace->id)->count() : 0,
            ],
            'legal_hold_active' => LegalHold::query()
                ->where('workspace_id', $workspace->id)
                ->where('is_active', true)
                ->exists(),
        ];

        $export = TenantExport::query()->create([
            'workspace_id' => $workspace->id,
            'requested_by_user_id' => $request->user()?->id,
            'status' => 'completed',
            'filters_json' => ['include' => $include],
            'download_token' => $token,
            'download_expires_at' => $expiresAt,
            'result_json' => $result,
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'tenant.export.created',
            resourceType: TenantExport::class,
            resourceId: (string) $export->id,
            meta: ['include' => $include, 'expires_at' => $expiresAt->toIso8601String()],
            request: $request
        );

        return response()->json([
            'data' => $export,
            'meta' => [
                'download_url' => url("/api/workspaces/{$workspace->slug}/exports/{$export->id}/download?token={$token}"),
            ],
        ], 201);
    }

    public function download(Request $request, Workspace $workspace, TenantExport $export): JsonResponse
    {
        abort_if($export->workspace_id !== $workspace->id, 404);
        abort_if(! $export->download_token, 404);
        abort_if($request->string('token')->toString() !== $export->download_token, 403, 'Invalid export token.');
        abort_if($export->download_expires_at && $export->download_expires_at->isPast(), 410, 'Export link expired.');

        return response()->json([
            'data' => [
                'id' => $export->id,
                'workspace_id' => $export->workspace_id,
                'filters' => $export->filters_json ?? [],
                'result' => $export->result_json ?? [],
                'generated_at' => $export->created_at,
            ],
        ]);
    }
}
