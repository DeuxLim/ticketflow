<?php

namespace App\Http\Controllers\Api\Scim;

use App\Http\Controllers\Controller;
use App\Models\ProvisionedDirectoryUser;
use App\Models\WorkspaceMembership;
use App\Models\WorkspaceRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScimGroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $groups = WorkspaceRole::query()
            ->where('workspace_id', $workspace->id)
            ->get()
            ->map(fn (WorkspaceRole $role) => [
                'id' => (string) $role->id,
                'displayName' => $role->name,
            ])
            ->values();

        return response()->json([
            'schemas' => ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            'totalResults' => $groups->count(),
            'Resources' => $groups,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $payload = $request->validate([
            'displayName' => ['required', 'string', 'max:120'],
        ]);

        $role = WorkspaceRole::query()->create([
            'workspace_id' => $workspace->id,
            'name' => $payload['displayName'],
            'slug' => str($payload['displayName'])->slug()->toString(),
            'description' => 'Provisioned from SCIM group',
            'is_system' => false,
        ]);

        return response()->json([
            'schemas' => ['urn:ietf:params:scim:schemas:core:2.0:Group'],
            'id' => (string) $role->id,
            'displayName' => $role->name,
        ], 201);
    }

    public function patch(Request $request, string $id): JsonResponse
    {
        $directory = $request->attributes->get('provisioning_directory');
        $workspace = $request->attributes->get('workspace');

        $role = WorkspaceRole::query()
            ->where('workspace_id', $workspace->id)
            ->whereKey($id)
            ->firstOrFail();

        $operationValue = data_get($request->input('Operations', []), '0.value', []);
        $members = data_get($operationValue, 'members', $operationValue);

        foreach ($members as $member) {
            $externalId = data_get($member, 'value');
            if (! $externalId) {
                continue;
            }

            $directoryUser = ProvisionedDirectoryUser::query()
                ->where('provisioning_directory_id', $directory->id)
                ->where('external_id', $externalId)
                ->first();

            if (! $directoryUser) {
                continue;
            }

            $membership = WorkspaceMembership::query()->firstOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'user_id' => $directoryUser->user_id,
                ],
                [
                    'joined_at' => now(),
                ]
            );

            $membership->roles()->syncWithoutDetaching([$role->id]);
        }

        return response()->json([
            'schemas' => ['urn:ietf:params:scim:schemas:core:2.0:Group'],
            'id' => (string) $role->id,
            'displayName' => $role->name,
        ]);
    }
}
