<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\TicketCustomField;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketCustomFieldController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        $fields = TicketCustomField::query()
            ->where('workspace_id', $workspace->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (TicketCustomField $field) => $this->payload($field));

        return response()->json(['data' => $fields]);
    }

    public function store(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $field = TicketCustomField::query()->create($this->attributes($request, $workspace));

        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.custom_field.created', TicketCustomField::class, (string) $field->id, ['key' => $field->key], $request);

        return response()->json(['data' => $this->payload($field)], 201);
    }

    public function update(Request $request, Workspace $workspace, TicketCustomField $field, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($field->workspace_id !== $workspace->id, 404);
        $field->update($this->attributes($request, $workspace, $field));
        $auditLogger->log($workspace->id, $request->user()?->id, 'ticket.custom_field.updated', TicketCustomField::class, (string) $field->id, ['key' => $field->key], $request);

        return response()->json(['data' => $this->payload($field->fresh())]);
    }

    private function attributes(Request $request, Workspace $workspace, ?TicketCustomField $field = null): array
    {
        $uniqueKey = Rule::unique('ticket_custom_fields', 'key')->where(fn ($query) => $query->where('workspace_id', $workspace->id));
        if ($field) {
            $uniqueKey->ignore($field->id);
        }

        $validated = $request->validate([
            'key' => [$field ? 'sometimes' : 'required', 'string', 'max:80', 'regex:/^[a-z0-9_-]+$/', $uniqueKey],
            'label' => [$field ? 'sometimes' : 'required', 'string', 'max:120'],
            'field_type' => [$field ? 'sometimes' : 'required', 'in:text,textarea,number,select,multiselect,checkbox,date'],
            'options' => ['nullable', 'array'],
            'validation' => ['nullable', 'array'],
            'is_required' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (array_key_exists('options', $validated)) {
            $validated['options_json'] = $validated['options'];
            unset($validated['options']);
        }

        if (array_key_exists('validation', $validated)) {
            $validated['validation_json'] = $validated['validation'];
            unset($validated['validation']);
        }

        return $validated + [
            'workspace_id' => $workspace->id,
            'options_json' => [],
            'validation_json' => [],
            'is_required' => false,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    private function payload(TicketCustomField $field): array
    {
        return [
            'id' => $field->id,
            'workspace_id' => $field->workspace_id,
            'key' => $field->key,
            'label' => $field->label,
            'field_type' => $field->field_type,
            'options' => $field->options_json ?? [],
            'validation' => $field->validation_json ?? [],
            'is_required' => $field->is_required,
            'is_active' => $field->is_active,
            'sort_order' => $field->sort_order,
            'created_at' => $field->created_at,
            'updated_at' => $field->updated_at,
        ];
    }
}
