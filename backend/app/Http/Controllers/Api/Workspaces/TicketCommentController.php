<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreTicketCommentRequest;
use App\Http\Requests\Workspaces\UpdateTicketCommentRequest;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
use App\Models\Workspace;
use App\Services\Sla\SlaEngine;
use App\Services\Webhooks\AutomationEngine;
use App\Services\Webhooks\IntegrationEventPublisher;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TicketCommentController extends Controller
{
    public function __construct(
        private readonly SlaEngine $slaEngine,
        private readonly AutomationEngine $automationEngine,
        private readonly IntegrationEventPublisher $integrationEventPublisher
    ) {
    }

    public function index(Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $comments = TicketComment::query()
            ->where('workspace_id', $workspace->id)
            ->where('ticket_id', $ticket->id)
            ->with(['user:id,first_name,last_name,email', 'customer:id,name,email'])
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $comments->map(fn (TicketComment $comment) => [
                'id' => $comment->id,
                'workspace_id' => $comment->workspace_id,
                'ticket_id' => $comment->ticket_id,
                'user_id' => $comment->user_id,
                'customer_id' => $comment->customer_id,
                'body' => $comment->body,
                'is_internal' => $comment->is_internal,
                'user' => $comment->user ? [
                    'id' => $comment->user->id,
                    'first_name' => $comment->user->first_name,
                    'last_name' => $comment->user->last_name,
                    'email' => $comment->user->email,
                ] : null,
                'customer' => $comment->customer ? [
                    'id' => $comment->customer->id,
                    'name' => $comment->customer->name,
                    'email' => $comment->customer->email,
                ] : null,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
            ])->values(),
            'meta' => [
                'total' => $comments->count(),
            ],
        ]);
    }

    public function store(StoreTicketCommentRequest $request, Workspace $workspace, Ticket $ticket): JsonResponse
    {
        $isInternal = (bool) $request->boolean('is_internal', false);

        if ($isInternal && ! $request->user()->hasWorkspacePermission($workspace->id, 'tickets.manage')) {
            return response()->json([
                'message' => 'Only ticket managers can post internal comments.',
            ], 403);
        }

        $comment = TicketComment::query()->create([
            'workspace_id' => $workspace->id,
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'customer_id' => null,
            'body' => $request->string('body')->toString(),
            'is_internal' => $isInternal,
        ]);

        ActivityLogger::log($workspace->id, $request->user()->id, 'ticket.comment_added', $comment, [
            'ticket_id' => $ticket->id,
            'is_internal' => $comment->is_internal,
        ]);

        if (! $isInternal) {
            $this->slaEngine->markFirstResponseIfNeeded($ticket);
        }

        $context = ['actor_user_id' => $request->user()->id];
        $this->automationEngine->apply($workspace, 'ticket.comment_added', $ticket, $context);
        $this->automationEngine->apply($workspace, 'ticket.commented', $ticket, $context);

        $this->integrationEventPublisher->publish($workspace, 'ticket.comment_added', [
            'ticket_id' => $ticket->id,
            'comment_id' => $comment->id,
            'is_internal' => $comment->is_internal,
        ]);

        $comment->load(['user:id,first_name,last_name,email', 'customer:id,name,email']);

        return response()->json([
            'data' => [
                'id' => $comment->id,
                'workspace_id' => $comment->workspace_id,
                'ticket_id' => $comment->ticket_id,
                'user_id' => $comment->user_id,
                'customer_id' => $comment->customer_id,
                'body' => $comment->body,
                'is_internal' => $comment->is_internal,
                'user' => $comment->user ? [
                    'id' => $comment->user->id,
                    'first_name' => $comment->user->first_name,
                    'last_name' => $comment->user->last_name,
                    'email' => $comment->user->email,
                ] : null,
                'customer' => $comment->customer ? [
                    'id' => $comment->customer->id,
                    'name' => $comment->customer->name,
                    'email' => $comment->customer->email,
                ] : null,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
            ],
        ], 201);
    }

    public function update(
        UpdateTicketCommentRequest $request,
        Workspace $workspace,
        Ticket $ticket,
        TicketComment $comment
    ): JsonResponse {
        abort_if($comment->workspace_id !== $workspace->id || $comment->ticket_id !== $ticket->id, 404);

        $this->authorizeCommentMutation($request, $workspace, $comment);

        $before = $comment->body;
        $comment->update([
            'body' => $request->string('body')->toString(),
        ]);

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.comment_updated', $comment, [
            'ticket_id' => $ticket->id,
            'from' => $before,
            'to' => $comment->body,
        ]);

        $this->integrationEventPublisher->publish($workspace, 'ticket.comment_updated', [
            'ticket_id' => $ticket->id,
            'comment_id' => $comment->id,
        ]);

        return response()->json([
            'data' => [
                'id' => $comment->id,
                'workspace_id' => $comment->workspace_id,
                'ticket_id' => $comment->ticket_id,
                'user_id' => $comment->user_id,
                'customer_id' => $comment->customer_id,
                'body' => $comment->body,
                'is_internal' => $comment->is_internal,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
            ],
        ]);
    }

    public function destroy(Request $request, Workspace $workspace, Ticket $ticket, TicketComment $comment): JsonResponse
    {
        abort_if($comment->workspace_id !== $workspace->id || $comment->ticket_id !== $ticket->id, 404);

        $this->authorizeCommentMutation($request, $workspace, $comment);

        $commentId = $comment->id;

        $attachments = TicketAttachment::query()->where('comment_id', $comment->id)->get();
        foreach ($attachments as $attachment) {
            Storage::disk($attachment->disk)->delete($attachment->path);
            $attachment->delete();
        }

        $comment->delete();

        ActivityLogger::log($workspace->id, $request->user()?->id, 'ticket.comment_deleted', $ticket, [
            'ticket_id' => $ticket->id,
            'comment_id' => $commentId,
        ]);

        $this->integrationEventPublisher->publish($workspace, 'ticket.comment_deleted', [
            'ticket_id' => $ticket->id,
            'comment_id' => $commentId,
        ]);

        return response()->json([
            'message' => 'Comment deleted successfully.',
        ]);
    }

    private function authorizeCommentMutation(Request $request, Workspace $workspace, TicketComment $comment): void
    {
        $canManage = $request->user()?->hasWorkspacePermission($workspace->id, 'tickets.manage');
        $isAuthor = $comment->user_id !== null && $comment->user_id === $request->user()?->id;

        if ($comment->is_internal) {
            abort_unless($canManage, 403, 'Only ticket managers can modify internal comments.');
            return;
        }

        abort_unless($canManage || $isAuthor, 403, 'You can only modify your own comment.');
    }
}
