<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\UpdateWorkspaceMemberRequest;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Models\WorkspaceRole;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceMemberController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        $memberships = WorkspaceMembership::query()
            ->with(['user:id,first_name,last_name,username,email', 'roles:id,workspace_id,name,slug'])
            ->where('workspace_id', $workspace->id)
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $memberships->map(fn (WorkspaceMembership $membership) => $this->serializeMembership($membership))->values(),
        ]);
    }

    public function roleOptions(Workspace $workspace): JsonResponse
    {
        $roles = WorkspaceRole::query()
            ->where('workspace_id', $workspace->id)
            ->orderBy('id')
            ->get(['id', 'name', 'slug']);

        return response()->json([
            'data' => $roles->map(fn (WorkspaceRole $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values(),
        ]);
    }

    public function assignable(Workspace $workspace): JsonResponse
    {
        $memberships = WorkspaceMembership::query()
            ->with(['user:id,first_name,last_name,email'])
            ->where('workspace_id', $workspace->id)
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $memberships
                ->filter(fn (WorkspaceMembership $membership) => $membership->user !== null)
                ->map(fn (WorkspaceMembership $membership) => [
                    'id' => $membership->id,
                    'user' => [
                        'id' => $membership->user->id,
                        'first_name' => $membership->user->first_name,
                        'last_name' => $membership->user->last_name,
                        'email' => $membership->user->email,
                    ],
                ])->values(),
        ]);
    }

    public function update(
        UpdateWorkspaceMemberRequest $request,
        Workspace $workspace,
        WorkspaceMembership $membership
    ): JsonResponse {
        abort_if($membership->workspace_id !== $workspace->id, 404);

        if ((int) $membership->user_id === (int) $request->user()->id) {
            return response()->json([
                'message' => 'You cannot change your own workspace access from this screen.',
            ], 422);
        }

        $membership->load(['user:id,first_name,last_name,username,email', 'roles:id,workspace_id,name,slug']);

        $roleIds = $request->validated('role_ids');
        $beforeRoles = $membership->roles->map(fn ($role) => [
            'id' => $role->id,
            'name' => $role->name,
            'slug' => $role->slug,
        ])->values()->all();

        if ($this->membershipHasAdminRole($membership)
            && ! $this->workspaceRoleIdsContainAdminRole($workspace, $roleIds)
            && $this->countAdminMemberships($workspace) <= 1) {
            return response()->json([
                'message' => 'The last Admin cannot be changed to a different role.',
            ], 422);
        }

        $membership->roles()->sync($roleIds);
        $membership->load(['user:id,first_name,last_name,username,email', 'roles:id,workspace_id,name,slug']);

        ActivityLogger::log($workspace->id, $request->user()->id, 'member.roles_updated', $membership, [
            'member_user_id' => $membership->user_id,
            'from_roles' => $beforeRoles,
            'to_roles' => $membership->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values()->all(),
        ]);

        return response()->json([
            'data' => $this->serializeMembership($membership),
        ]);
    }

    public function destroy(Request $request, Workspace $workspace, WorkspaceMembership $membership): JsonResponse
    {
        abort_if($membership->workspace_id !== $workspace->id, 404);

        if ((int) $membership->user_id === (int) $request->user()->id) {
            return response()->json([
                'message' => 'You cannot remove yourself from the workspace from this screen.',
            ], 422);
        }

        $membership->load(['user:id,first_name,last_name,username,email', 'roles:id,workspace_id,name,slug']);

        if ($this->membershipHasAdminRole($membership) && $this->countAdminMemberships($workspace) <= 1) {
            return response()->json([
                'message' => 'The last Admin cannot be removed from the workspace.',
            ], 422);
        }

        ActivityLogger::log($workspace->id, $request->user()->id, 'member.removed', $membership, [
            'member_user_id' => $membership->user_id,
            'roles' => $membership->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values()->all(),
        ]);

        $membership->roles()->detach();
        $membership->delete();

        return response()->json([
            'message' => 'Member removed.',
        ]);
    }

    private function serializeMembership(WorkspaceMembership $membership): array
    {
        return [
            'id' => $membership->id,
            'user' => [
                'id' => $membership->user->id,
                'first_name' => $membership->user->first_name,
                'last_name' => $membership->user->last_name,
                'username' => $membership->user->username,
                'email' => $membership->user->email,
            ],
            'roles' => $membership->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values(),
            'joined_at' => $membership->joined_at,
        ];
    }

    private function membershipHasAdminRole(WorkspaceMembership $membership): bool
    {
        return $membership->roles->contains(fn ($role) => $role->slug === 'admin');
    }

    private function workspaceRoleIdsContainAdminRole(Workspace $workspace, array $roleIds): bool
    {
        return WorkspaceRole::query()
            ->where('workspace_id', $workspace->id)
            ->whereIn('id', $roleIds)
            ->where('slug', 'admin')
            ->exists();
    }

    private function countAdminMemberships(Workspace $workspace): int
    {
        return WorkspaceMembership::query()
            ->where('workspace_id', $workspace->id)
            ->whereHas('roles', fn ($query) => $query->where('slug', 'admin'))
            ->count();
    }
}
