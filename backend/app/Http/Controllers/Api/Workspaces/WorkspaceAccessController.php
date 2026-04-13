<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceAccessController extends Controller
{
    public function show(Request $request, Workspace $workspace): JsonResponse
    {
        $membership = WorkspaceMembership::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $request->user()->id)
            ->with(['roles.permissions'])
            ->firstOrFail();

        $roles = $membership->roles->map(fn ($role) => [
            'id' => $role->id,
            'name' => $role->name,
            'slug' => $role->slug,
        ])->values();

        $permissions = $membership->roles
            ->flatMap(fn ($role) => $role->permissions->pluck('slug'))
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'data' => [
                'workspace_id' => $workspace->id,
                'roles' => $roles,
                'permissions' => $permissions,
            ],
        ]);
    }
}
