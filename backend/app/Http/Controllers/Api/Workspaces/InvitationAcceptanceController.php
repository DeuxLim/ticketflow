<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Actions\Workspaces\AcceptWorkspaceInvitationAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\AcceptInvitationRequest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InvitationAcceptanceController extends Controller
{
    public function __construct(private readonly AcceptWorkspaceInvitationAction $acceptWorkspaceInvitationAction)
    {
    }

    public function store(AcceptInvitationRequest $request): JsonResponse
    {
        try {
            $invitation = $this->acceptWorkspaceInvitationAction->execute(
                user: $request->user(),
                token: $request->string('token')->toString(),
            );
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Invitation not found.'], 404);
        } catch (HttpException $exception) {
            return response()->json(['message' => $exception->getMessage()], $exception->getStatusCode());
        }

        return response()->json([
            'data' => [
                'id' => $invitation->id,
                'workspace_id' => $invitation->workspace_id,
                'status' => $invitation->status,
            ],
        ]);
    }
}
