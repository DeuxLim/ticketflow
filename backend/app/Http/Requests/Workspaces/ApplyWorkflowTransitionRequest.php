<?php

namespace App\Http\Requests\Workspaces;

use Illuminate\Foundation\Http\FormRequest;

class ApplyWorkflowTransitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'to_status' => ['required', 'string', 'max:40'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
