<?php

namespace App\Http\Requests\Workspaces;

use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\Workspace;
use Illuminate\Foundation\Http\FormRequest;

class StoreTicketAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240'],
            'comment_id' => ['nullable', 'integer', 'exists:ticket_comments,id'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            /** @var Workspace|null $workspace */
            $workspace = $this->route('workspace');
            /** @var Ticket|null $ticket */
            $ticket = $this->route('ticket');

            if (! $workspace || ! $ticket) {
                return;
            }

            if ($ticket->workspace_id !== $workspace->id) {
                $validator->errors()->add('file', 'Ticket does not belong to the active workspace.');
                return;
            }

            if ($this->filled('comment_id')) {
                $commentBelongs = TicketComment::query()
                    ->where('id', (int) $this->input('comment_id'))
                    ->where('workspace_id', $workspace->id)
                    ->where('ticket_id', $ticket->id)
                    ->exists();

                if (! $commentBelongs) {
                    $validator->errors()->add('comment_id', 'Comment must belong to the active ticket.');
                }
            }
        }];
    }
}
