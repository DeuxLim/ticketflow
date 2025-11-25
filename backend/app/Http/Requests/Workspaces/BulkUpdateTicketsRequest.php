<?php

namespace App\Http\Requests\Workspaces;

use App\Models\Ticket;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateTicketsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ticket_ids' => ['required', 'array', 'min:1'],
            'ticket_ids.*' => ['required', 'integer', 'exists:tickets,id'],
            'status' => ['nullable', 'in:open,in_progress,pending,resolved,closed'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'assigned_to_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            /** @var Workspace|null $workspace */
            $workspace = $this->route('workspace');

            if (! $workspace) {
                return;
            }

            $ids = collect($this->input('ticket_ids', []))->map(fn ($id) => (int) $id)->filter();

            if ($ids->isNotEmpty()) {
                $count = Ticket::query()
                    ->where('workspace_id', $workspace->id)
                    ->whereIn('id', $ids->all())
                    ->count();

                if ($count !== $ids->count()) {
                    $validator->errors()->add('ticket_ids', 'All ticket IDs must belong to the active workspace.');
                }
            }

            if ($this->has('assigned_to_user_id') && $this->input('assigned_to_user_id') !== null) {
                $isMember = WorkspaceMembership::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('user_id', (int) $this->input('assigned_to_user_id'))
                    ->exists();

                if (! $isMember) {
                    $validator->errors()->add('assigned_to_user_id', 'Assignee must be a workspace member.');
                }
            }

            if (! $this->filled('status') && ! $this->filled('priority') && ! $this->has('assigned_to_user_id')) {
                $validator->errors()->add('ticket_ids', 'At least one update field is required.');
            }
        }];
    }
}
