<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\TicketCategory;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Workspaces\WorkspaceFoundationBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketCategoryController extends Controller
{
    public function __construct(private readonly WorkspaceFoundationBootstrapper $bootstrapper)
    {
    }

    public function index(Workspace $workspace): JsonResponse
    {
        $this->bootstrapper->ensureSettingsFoundation($workspace);

        return response()->json(['data' => TicketCategory::query()->where('workspace_id', $workspace->id)->orderBy('sort_order')->orderBy('id')->get()]);
    }

    public function store(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $category = TicketCategory::query()->create($request->validate($this->rules($workspace)) + [
            'workspace_id' => $workspace->id,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.category.created', TicketCategory::class, (string) $category->id, ['key' => $category->key], $request);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, Workspace $workspace, TicketCategory $category, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($category->workspace_id !== $workspace->id, 404);
        $category->update($request->validate($this->rules($workspace, $category)));
        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.category.updated', TicketCategory::class, (string) $category->id, ['key' => $category->key], $request);

        return response()->json(['data' => $category->fresh()]);
    }

    private function rules(Workspace $workspace, ?TicketCategory $category = null): array
    {
        $uniqueKey = Rule::unique('ticket_categories', 'key')->where(fn ($query) => $query->where('workspace_id', $workspace->id));
        if ($category) {
            $uniqueKey->ignore($category->id);
        }

        return [
            'key' => [$category ? 'sometimes' : 'required', 'string', 'max:80', 'regex:/^[a-z0-9_-]+$/', $uniqueKey],
            'name' => [$category ? 'sometimes' : 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
