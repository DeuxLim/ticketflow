<?php

namespace App\Http\Requests\Workspaces;

use App\Models\Workspace;
use App\Models\WorkspaceRole;
use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkspaceMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role_ids' => ['required', 'array', 'size:1'],
            'role_ids.*' => ['required', 'integer', 'exists:workspace_roles,id'],
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

            if (count(array_unique($roleIds)) !== 1) {
                $validator->errors()->add('role_ids', 'Select exactly one workspace role.');

                return;
            }

            $count = WorkspaceRole::query()
                ->where('workspace_id', $workspace->id)
                ->whereIn('id', $roleIds)
                ->count();

            if ($count !== 1) {
                $validator->errors()->add('role_ids', 'All roles must belong to the active workspace.');
            }
        }];
    }
}
