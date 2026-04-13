<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\TicketFormTemplate;
use App\Models\TicketType;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Workspaces\WorkspaceFoundationBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketFormTemplateController extends Controller
{
    public function __construct(private readonly WorkspaceFoundationBootstrapper $bootstrapper)
    {
    }

    public function index(Workspace $workspace): JsonResponse
    {
        $this->bootstrapper->ensureSettingsFoundation($workspace);

        $templates = TicketFormTemplate::query()
            ->where('workspace_id', $workspace->id)
            ->with('ticketType:id,key,name')
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get()
            ->map(fn (TicketFormTemplate $template) => $this->payload($template));

        return response()->json(['data' => $templates]);
    }

    public function store(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $this->validated($request, $workspace);

        $template = DB::transaction(function () use ($validated, $workspace): TicketFormTemplate {
            if ((bool) ($validated['is_default'] ?? false)) {
                TicketFormTemplate::query()->where('workspace_id', $workspace->id)->update(['is_default' => false]);
            }

            return TicketFormTemplate::query()->create($validated + [
                'workspace_id' => $workspace->id,
                'field_schema_json' => [],
                'visibility_rules_json' => [],
                'required_rules_json' => [],
                'is_default' => false,
                'is_active' => true,
            ]);
        });

        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.form_template.created', TicketFormTemplate::class, (string) $template->id, ['name' => $template->name], $request);

        return response()->json(['data' => $this->payload($template->fresh('ticketType'))], 201);
    }

    public function update(Request $request, Workspace $workspace, TicketFormTemplate $template, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($template->workspace_id !== $workspace->id, 404);
        $validated = $this->validated($request, $workspace, $template);

        DB::transaction(function () use ($validated, $workspace, $template): void {
            if ((bool) ($validated['is_default'] ?? false)) {
                TicketFormTemplate::query()->where('workspace_id', $workspace->id)->whereKeyNot($template->id)->update(['is_default' => false]);
            }

            $template->update($validated);
        });

        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.form_template.updated', TicketFormTemplate::class, (string) $template->id, ['name' => $template->name], $request);

        return response()->json(['data' => $this->payload($template->fresh('ticketType'))]);
    }

    private function validated(Request $request, Workspace $workspace, ?TicketFormTemplate $template = null): array
    {
        $validated = $request->validate([
            'ticket_type_id' => ['nullable', 'integer', 'exists:ticket_types,id'],
            'name' => [$template ? 'sometimes' : 'required', 'string', 'max:120'],
            'field_schema' => ['nullable', 'array'],
            'visibility_rules' => ['nullable', 'array'],
            'required_rules' => ['nullable', 'array'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['ticket_type_id'])) {
            $belongs = TicketType::query()
                ->where('workspace_id', $workspace->id)
                ->whereKey($validated['ticket_type_id'])
                ->exists();

            abort_unless($belongs, 422, 'Ticket type must belong to the active workspace.');
        }

        foreach ([
            'field_schema' => 'field_schema_json',
            'visibility_rules' => 'visibility_rules_json',
            'required_rules' => 'required_rules_json',
        ] as $source => $target) {
            if (array_key_exists($source, $validated)) {
                $validated[$target] = $validated[$source];
                unset($validated[$source]);
            }
        }

        return $validated;
    }

    private function payload(TicketFormTemplate $template): array
    {
        return [
            'id' => $template->id,
            'workspace_id' => $template->workspace_id,
            'ticket_type_id' => $template->ticket_type_id,
            'name' => $template->name,
            'field_schema' => $template->field_schema_json ?? [],
            'visibility_rules' => $template->visibility_rules_json ?? [],
            'required_rules' => $template->required_rules_json ?? [],
            'is_default' => $template->is_default,
            'is_active' => $template->is_active,
            'ticket_type' => $template->relationLoaded('ticketType') && $template->ticketType ? [
                'id' => $template->ticketType->id,
                'key' => $template->ticketType->key,
                'name' => $template->ticketType->name,
            ] : null,
            'created_at' => $template->created_at,
            'updated_at' => $template->updated_at,
        ];
    }
}
