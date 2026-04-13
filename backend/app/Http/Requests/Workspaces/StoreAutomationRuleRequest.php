<?php

namespace App\Http\Requests\Workspaces;

use Illuminate\Foundation\Http\FormRequest;

class StoreAutomationRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'event_type' => ['required', 'string', 'max:120'],
            'conditions' => ['nullable', 'array'],
            'actions' => ['required', 'array', 'min:1'],
            'priority' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'max_chain_depth' => ['sometimes', 'integer', 'min:0', 'max:10'],
            'idempotency_scope' => ['sometimes', 'string', 'max:80'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
