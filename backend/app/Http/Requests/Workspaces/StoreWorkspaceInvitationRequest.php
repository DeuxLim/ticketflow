<?php

namespace App\Http\Requests\Workspaces;

use App\Models\Workspace;
use App\Models\WorkspaceRole;
use Illuminate\Foundation\Http\FormRequest;

class StoreWorkspaceInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['required', 'integer', 'exists:workspace_roles,id'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:30'],
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

            $roleIds = $this->input('role_ids', []);

            if ($roleIds === []) {
                return;
            }

            $count = WorkspaceRole::query()
                ->where('workspace_id', $workspace->id)
                ->whereIn('id', $roleIds)
                ->count();

            if ($count !== count(array_unique($roleIds))) {
                $validator->errors()->add('role_ids', 'All roles must belong to the active workspace.');
            }
        }];
    }
}
