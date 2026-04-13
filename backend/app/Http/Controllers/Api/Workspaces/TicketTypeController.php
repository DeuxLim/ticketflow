<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\TicketType;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Workspaces\WorkspaceFoundationBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TicketTypeController extends Controller
{
    public function __construct(private readonly WorkspaceFoundationBootstrapper $bootstrapper)
    {
    }

    public function index(Workspace $workspace): JsonResponse
    {
        $this->bootstrapper->ensureSettingsFoundation($workspace);

        return response()->json(['data' => TicketType::query()->where('workspace_id', $workspace->id)->orderBy('sort_order')->orderBy('id')->get()]);
    }

    public function store(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate($this->rules($workspace));
        $type = DB::transaction(function () use ($validated, $workspace): TicketType {
            if ((bool) ($validated['is_default'] ?? false)) {
                TicketType::query()->where('workspace_id', $workspace->id)->update(['is_default' => false]);
            }

            return TicketType::query()->create($validated + ['workspace_id' => $workspace->id, 'is_default' => false, 'is_active' => true, 'sort_order' => 0]);
        });

        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.type.created', TicketType::class, (string) $type->id, ['key' => $type->key], $request);

        return response()->json(['data' => $type], 201);
    }

    public function update(Request $request, Workspace $workspace, TicketType $type, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($type->workspace_id !== $workspace->id, 404);
        $validated = $request->validate($this->rules($workspace, $type));
        DB::transaction(function () use ($validated, $workspace, $type): void {
            if ((bool) ($validated['is_default'] ?? false)) {
                TicketType::query()->where('workspace_id', $workspace->id)->whereKeyNot($type->id)->update(['is_default' => false]);
            }
            $type->update($validated);
        });
        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.type.updated', TicketType::class, (string) $type->id, ['key' => $type->key], $request);

        return response()->json(['data' => $type->fresh()]);
    }

    private function rules(Workspace $workspace, ?TicketType $type = null): array
    {
        $uniqueKey = Rule::unique('ticket_types', 'key')->where(fn ($query) => $query->where('workspace_id', $workspace->id));
        if ($type) {
            $uniqueKey->ignore($type->id);
        }

        return [
            'key' => [$type ? 'sometimes' : 'required', 'string', 'max:80', 'regex:/^[a-z0-9_-]+$/', $uniqueKey],
            'name' => [$type ? 'sometimes' : 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
