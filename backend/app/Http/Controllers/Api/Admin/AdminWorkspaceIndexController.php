<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWorkspaceIndexController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $perPage = min((int) $request->integer('per_page', 20), 100);
        $search = trim((string) $request->string('search'));

        $query = Workspace::query()
            ->with('owner:id,first_name,last_name,username,email')
            ->withCount(['memberships', 'tickets'])
            ->latest('id');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $workspaces = $query->paginate($perPage);

        return response()->json([
            'data' => collect($workspaces->items())->map(fn (Workspace $workspace) => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'owner_user_id' => $workspace->owner_user_id,
                'owner' => $workspace->owner ? [
                    'id' => $workspace->owner->id,
                    'first_name' => $workspace->owner->first_name,
                    'last_name' => $workspace->owner->last_name,
                    'username' => $workspace->owner->username,
                    'email' => $workspace->owner->email,
                ] : null,
                'memberships_count' => $workspace->memberships_count,
                'tickets_count' => $workspace->tickets_count,
                'tenant_mode' => $workspace->tenant_mode,
                'lifecycle_status' => $workspace->lifecycle_status,
                'maintenance_mode' => (bool) $workspace->maintenance_mode,
                'usage_limits' => is_array($workspace->usage_limits_json)
                    ? $workspace->usage_limits_json
                    : ($workspace->usage_limits_json ? json_decode((string) $workspace->usage_limits_json, true, 512, JSON_THROW_ON_ERROR) : []),
                'feature_flags' => is_array($workspace->feature_flags)
                    ? $workspace->feature_flags
                    : ($workspace->feature_flags ? json_decode((string) $workspace->feature_flags, true, 512, JSON_THROW_ON_ERROR) : []),
                'created_at' => $workspace->created_at,
            ]),
            'meta' => [
                'current_page' => $workspaces->currentPage(),
                'last_page' => $workspaces->lastPage(),
                'per_page' => $workspaces->perPage(),
                'total' => $workspaces->total(),
            ],
        ]);
    }
}
