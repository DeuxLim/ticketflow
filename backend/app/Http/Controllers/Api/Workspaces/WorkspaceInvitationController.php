<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Actions\Workspaces\CreateWorkspaceInvitationAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreWorkspaceInvitationRequest;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use Illuminate\Http\JsonResponse;

class WorkspaceInvitationController extends Controller
{
    public function __construct(private readonly CreateWorkspaceInvitationAction $createWorkspaceInvitationAction)
    {
    }

    public function store(StoreWorkspaceInvitationRequest $request, Workspace $workspace): JsonResponse
    {
        $result = $this->createWorkspaceInvitationAction->execute(
            workspace: $workspace,
            inviter: $request->user(),
            email: $request->string('email')->toString(),
            roleIds: $request->input('role_ids', []),
            expiresInDays: (int) $request->input('expires_in_days', 7),
        );

        $invitation = $result['invitation'];

        return response()->json([
            'data' => [
                'id' => $invitation->id,
                'workspace_id' => $invitation->workspace_id,
                'email' => $invitation->email,
                'status' => $invitation->status,
                'expires_at' => $invitation->expires_at,
                'role_ids' => $invitation->roles()->pluck('workspace_roles.id')->all(),
                'token' => $result['token'],
            ],
        ], 201);
    }

    public function index(Workspace $workspace): JsonResponse
    {
        $invitations = WorkspaceInvitation::query()
            ->with('roles:id,name,slug')
            ->where('workspace_id', $workspace->id)
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $invitations->map(fn (WorkspaceInvitation $invitation) => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'status' => $invitation->status,
                'expires_at' => $invitation->expires_at,
                'accepted_at' => $invitation->accepted_at,
                'roles' => $invitation->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                ])->values(),
            ])->values(),
        ]);
    }

    public function cancel(Workspace $workspace, WorkspaceInvitation $invitation): JsonResponse
    {
        if ($invitation->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending invitations can be cancelled.',
            ], 422);
        }

        $invitation->update(['status' => 'cancelled']);

        return response()->json([
            'data' => [
                'id' => $invitation->id,
                'status' => $invitation->status,
            ],
        ]);
    }
}
