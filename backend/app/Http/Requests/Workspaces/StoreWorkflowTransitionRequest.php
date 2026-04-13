<?php

namespace App\Http\Requests\Workspaces;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkflowTransitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'transitions' => ['required', 'array', 'min:1'],
            'transitions.*.from_status' => ['required', 'string', 'max:40'],
            'transitions.*.to_status' => ['required', 'string', 'max:40'],
            'transitions.*.required_permission' => ['nullable', 'string', 'max:120'],
            'transitions.*.requires_approval' => ['sometimes', 'boolean'],
            'transitions.*.sort_order' => ['sometimes', 'integer', 'min:0'],
            'transitions.*.approver_mode' => ['nullable', 'in:role,users'],
            'transitions.*.approver_role_slug' => ['nullable', 'string', 'max:80'],
            'transitions.*.approver_user_ids' => ['nullable', 'array'],
            'transitions.*.approver_user_ids.*' => ['integer'],
            'transitions.*.approval_timeout_minutes' => ['nullable', 'integer', 'min:5', 'max:10080'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
