<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Models\WorkspaceRole;
use Illuminate\Http\JsonResponse;

class WorkspaceRoleController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        $roles = WorkspaceRole::query()
            ->where('workspace_id', $workspace->id)
            ->orderBy('id')
            ->get(['id', 'name', 'slug', 'description', 'is_system']);

        return response()->json([
            'data' => $roles,
        ]);
    }
}
