<?php

namespace App\Http\Requests\Workspaces;

use Illuminate\Foundation\Http\FormRequest;

class StoreSlaPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
            'first_response_minutes' => ['required', 'integer', 'min:1'],
            'resolution_minutes' => ['required', 'integer', 'min:1'],
            'business_calendar_id' => ['nullable', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
