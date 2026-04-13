<?php

namespace App\Http\Requests\Workspaces;

use App\Models\Customer;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['sometimes', 'required', 'integer', 'exists:customers,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string', 'max:10000'],
            'priority' => ['sometimes', 'required', 'in:low,medium,high,urgent'],
            'status' => ['sometimes', 'required', 'in:open,in_progress,resolved,closed'],
            'assigned_to_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'queue_key' => ['sometimes', 'nullable', 'string', 'max:120'],
            'category' => ['sometimes', 'nullable', 'string', 'max:120'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['required', 'string', 'max:50'],
            'custom_fields' => ['sometimes', 'nullable', 'array'],
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

            if ($this->filled('customer_id')) {
                $customerBelongs = Customer::query()
                    ->where('id', (int) $this->input('customer_id'))
                    ->where('workspace_id', $workspace->id)
                    ->exists();

                if (! $customerBelongs) {
                    $validator->errors()->add('customer_id', 'Customer must belong to the active workspace.');
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
        }];
    }
}
