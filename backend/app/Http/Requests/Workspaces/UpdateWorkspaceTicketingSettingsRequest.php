<?php

namespace App\Http\Requests\Workspaces;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkspaceTicketingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ticket_number_format' => ['sometimes', 'required', 'string', 'max:80'],
            'assignment_strategy' => ['sometimes', 'required', 'in:manual,round_robin,least_open_load'],
            'ticketing' => ['nullable', 'array'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if (! $this->filled('ticket_number_format')) {
                return;
            }

            if (! str_contains($this->string('ticket_number_format')->toString(), '{seq')) {
                $validator->errors()->add('ticket_number_format', 'Ticket number format must include the sequence placeholder.');
            }
        }];
    }
}
