<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreTicketAttachmentRequest;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Webhooks\IntegrationEventPublisher;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketAttachmentController extends Controller
{
    public function __construct(private readonly IntegrationEventPublisher $integrationEventPublisher)
    {
    }

    public function index(Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $attachments = TicketAttachment::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->with(['uploader:id,first_name,last_name,email'])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $attachments->map(fn (TicketAttachment $attachment) => [
                'id' => $attachment->id,
                'ticket_id' => $attachment->ticket_id,
                'comment_id' => $attachment->comment_id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size_bytes' => $attachment->size_bytes,
                'uploader' => $attachment->uploader ? [
                    'id' => $attachment->uploader->id,
                    'first_name' => $attachment->uploader->first_name,
                    'last_name' => $attachment->uploader->last_name,
                    'email' => $attachment->uploader->email,
                ] : null,
                'created_at' => $attachment->created_at,
            ])->values(),
            'meta' => [
                'total' => $attachments->count(),
            ],
        ]);
    }

    public function store(
        StoreTicketAttachmentRequest $request,
        Workspace $workspace,
        Ticket $ticket,
        AuditLogger $auditLogger
    ): JsonResponse {
        $file = $request->file('file');
        $disk = 'local';
        $path = $file->store("tickets/{$workspace->id}/{$ticket->id}", $disk);

        $attachment = TicketAttachment::query()->create([
            'workspace_id' => $workspace->id,
            'ticket_id' => $ticket->id,
            'comment_id' => $request->input('comment_id'),
            'uploaded_by_user_id' => $request->user()?->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => (int) $file->getSize(),
        ]);

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.attachment_added', $ticket, [
            'attachment_id' => $attachment->id,
            'name' => $attachment->original_name,
            'size_bytes' => $attachment->size_bytes,
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'ticket.attachment.created',
            resourceType: TicketAttachment::class,
            resourceId: (string) $attachment->id,
            meta: [
                'ticket_id' => $ticket->id,
                'name' => $attachment->original_name,
                'size_bytes' => $attachment->size_bytes,
            ],
            request: $request
        );

        $this->integrationEventPublisher->publish($workspace, 'ticket.attachment_added', [
            'ticket_id' => $ticket->id,
            'attachment_id' => $attachment->id,
            'name' => $attachment->original_name,
            'size_bytes' => $attachment->size_bytes,
        ]);

        return response()->json([
            'data' => [
                'id' => $attachment->id,
                'ticket_id' => $attachment->ticket_id,
                'comment_id' => $attachment->comment_id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size_bytes' => $attachment->size_bytes,
                'created_at' => $attachment->created_at,
            ],
        ], 201);
    }

    public function download(Workspace $workspace, Ticket $ticket, TicketAttachment $attachment): StreamedResponse
    {
        abort_if($attachment->workspace_id !== $workspace->id || $attachment->ticket_id !== $ticket->id, 404);

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->original_name);
    }

    public function destroy(Workspace $workspace, Ticket $ticket, TicketAttachment $attachment): JsonResponse
    {
        abort_if($attachment->workspace_id !== $workspace->id || $attachment->ticket_id !== $ticket->id, 404);

        Storage::disk($attachment->disk)->delete($attachment->path);
        $attachment->delete();

        ActivityLogger::log($workspace->id, request()->user()?->id, 'ticket.attachment_deleted', $ticket, [
            'attachment_id' => $attachment->id,
            'name' => $attachment->original_name,
        ]);

        return response()->json([
            'message' => 'Attachment deleted successfully.',
        ]);
    }
}
