<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\TicketTag;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Workspaces\WorkspaceFoundationBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketTagController extends Controller
{
    public function __construct(private readonly WorkspaceFoundationBootstrapper $bootstrapper)
    {
    }

    public function index(Workspace $workspace): JsonResponse
    {
        $this->bootstrapper->ensureSettingsFoundation($workspace);

        return response()->json(['data' => TicketTag::query()->where('workspace_id', $workspace->id)->orderBy('name')->get()]);
    }

    public function store(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $tag = TicketTag::query()->create($request->validate($this->rules($workspace)) + [
            'workspace_id' => $workspace->id,
            'is_active' => true,
        ]);

        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.tag.created', TicketTag::class, (string) $tag->id, ['name' => $tag->name], $request);

        return response()->json(['data' => $tag], 201);
    }

    public function update(Request $request, Workspace $workspace, TicketTag $tag, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($tag->workspace_id !== $workspace->id, 404);
        $tag->update($request->validate($this->rules($workspace, $tag)));
        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.tag.updated', TicketTag::class, (string) $tag->id, ['name' => $tag->name], $request);

        return response()->json(['data' => $tag->fresh()]);
    }

    private function rules(Workspace $workspace, ?TicketTag $tag = null): array
    {
        $uniqueName = Rule::unique('ticket_tags', 'name')->where(fn ($query) => $query->where('workspace_id', $workspace->id));
        if ($tag) {
            $uniqueName->ignore($tag->id);
        }

        return [
            'name' => [$tag ? 'sometimes' : 'required', 'string', 'max:80', $uniqueName],
            'color' => ['nullable', 'string', 'max:40'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
