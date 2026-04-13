<?php

namespace App\Http\Requests\Workspaces;

use App\Models\Customer;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'status' => ['nullable', 'in:open,in_progress,resolved,closed'],
            'assigned_to_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'queue_key' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['required', 'string', 'max:50'],
            'custom_fields' => ['nullable', 'array'],
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

            $customerId = (int) $this->input('customer_id');
            if ($customerId > 0) {
                $customerBelongs = Customer::query()
                    ->where('id', $customerId)
                    ->where('workspace_id', $workspace->id)
                    ->exists();

                if (! $customerBelongs) {
                    $validator->errors()->add('customer_id', 'Customer must belong to the active workspace.');
                }
            }

            $assigneeId = $this->input('assigned_to_user_id');
            if ($assigneeId !== null) {
                $isMember = WorkspaceMembership::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('user_id', (int) $assigneeId)
                    ->exists();

                if (! $isMember) {
                    $validator->errors()->add('assigned_to_user_id', 'Assignee must be a workspace member.');
                }
            }
        }];
    }
}
