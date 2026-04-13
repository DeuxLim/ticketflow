<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Http\JsonResponse;

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
            'data' => $memberships->map(fn (WorkspaceMembership $membership) => [
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
            ])->values(),
        ]);
    }
}
