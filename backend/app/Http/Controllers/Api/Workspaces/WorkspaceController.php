<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Actions\Workspaces\CreateWorkspaceAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function __construct(private readonly CreateWorkspaceAction $createWorkspaceAction)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $workspaces = Workspace::query()
            ->whereHas('memberships', fn ($query) => $query->where('user_id', $request->user()->id))
            ->latest('id')
            ->get();

        return response()->json([
            'data' => WorkspaceResource::collection($workspaces),
        ]);
    }

    public function store(StoreWorkspaceRequest $request): JsonResponse
    {
        $workspace = $this->createWorkspaceAction->execute(
            owner: $request->user(),
            name: $request->string('name')->toString(),
            slug: $request->string('slug')->toString(),
        );

        return (new WorkspaceResource($workspace))
            ->response()
            ->setStatusCode(201);
    }
}
