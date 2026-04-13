<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditEventController extends Controller
{
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        $query = AuditEvent::query()
            ->where('workspace_id', $workspace->id)
            ->latest('id');

        if ($action = $request->string('action')->toString()) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($actorId = $request->integer('actor_user_id')) {
            $query->where('actor_user_id', $actorId);
        }

        if ($from = $request->string('from')->toString()) {
            $query->where('created_at', '>=', $from);
        }

        if ($to = $request->string('to')->toString()) {
            $query->where('created_at', '<=', $to);
        }

        $perPage = min(max($request->integer('per_page', 25), 1), 200);
        $events = $query->paginate($perPage);

        return response()->json([
            'data' => $events->items(),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }
}
