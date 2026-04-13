<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreSavedViewRequest;
use App\Models\SavedView;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;

class SavedViewController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        $userId = request()->user()?->id;

        $views = SavedView::query()
            ->where('workspace_id', $workspace->id)
            ->where(function ($query) use ($userId): void {
                $query->where('is_shared', true)
                    ->orWhere('created_by_user_id', $userId);
            })
            ->latest('id')
            ->get()
            ->map(fn (SavedView $view) => [
                'id' => $view->id,
                'name' => $view->name,
                'filters' => $view->filters(),
                'is_shared' => $view->is_shared,
                'created_by_user_id' => $view->created_by_user_id,
                'created_at' => $view->created_at,
            ]);

        return response()->json(['data' => $views]);
    }

    public function store(StoreSavedViewRequest $request, Workspace $workspace): JsonResponse
    {
        $view = SavedView::query()->create([
            'workspace_id' => $workspace->id,
            'created_by_user_id' => $request->user()?->id,
            'name' => $request->string('name')->toString(),
            'filters_json' => json_encode($request->input('filters', []), JSON_THROW_ON_ERROR),
            'is_shared' => $request->boolean('is_shared', false),
        ]);

        return response()->json([
            'data' => [
                'id' => $view->id,
                'name' => $view->name,
                'filters' => $view->filters(),
                'is_shared' => $view->is_shared,
            ],
        ], 201);
    }

    public function destroy(Workspace $workspace, SavedView $view): JsonResponse
    {
        abort_if($view->workspace_id !== $workspace->id, 404);

        $user = request()->user();
        $canDeleteAny = $user?->hasWorkspacePermission($workspace->id, 'tickets.manage');

        abort_unless($canDeleteAny || $view->created_by_user_id === $user?->id, 403);

        $view->delete();

        return response()->json(['message' => 'Saved view deleted.']);
    }
}
