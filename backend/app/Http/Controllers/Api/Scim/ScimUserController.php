<?php

namespace App\Http\Controllers\Api\Scim;

use App\Http\Controllers\Controller;
use App\Models\ProvisionedDirectoryUser;
use App\Models\User;
use App\Models\WorkspaceMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ScimUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $directory = $request->attributes->get('provisioning_directory');

        $resources = ProvisionedDirectoryUser::query()
            ->where('provisioning_directory_id', $directory->id)
            ->with('user')
            ->get()
            ->map(function (ProvisionedDirectoryUser $entry): array {
                return [
                    'id' => (string) $entry->external_id,
                    'userName' => $entry->user->email,
                    'name' => [
                        'givenName' => $entry->user->first_name,
                        'familyName' => $entry->user->last_name,
                    ],
                    'active' => $entry->active,
                ];
            })
            ->values();

        return response()->json([
            'schemas' => ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            'totalResults' => $resources->count(),
            'Resources' => $resources,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $directory = $request->attributes->get('provisioning_directory');
        $workspace = $directory->workspace;

        $payload = $request->validate([
            'userName' => ['required', 'email', 'max:255'],
            'name.givenName' => ['nullable', 'string', 'max:120'],
            'name.familyName' => ['nullable', 'string', 'max:120'],
            'active' => ['sometimes', 'boolean'],
            'externalId' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::query()->firstOrCreate(
            ['email' => $payload['userName']],
            [
                'first_name' => $payload['name']['givenName'] ?? 'SCIM',
                'last_name' => $payload['name']['familyName'] ?? 'User',
                'username' => Str::lower(Str::slug(($payload['name']['givenName'] ?? 'scim').'-'.Str::random(6))),
                'password' => Hash::make(Str::random(24)),
                'is_platform_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        WorkspaceMembership::query()->firstOrCreate([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
        ], [
            'joined_at' => now(),
        ]);

        $externalId = $payload['externalId'] ?? Str::uuid()->toString();

        ProvisionedDirectoryUser::query()->updateOrCreate(
            [
                'provisioning_directory_id' => $directory->id,
                'external_id' => $externalId,
            ],
            [
                'user_id' => $user->id,
                'active' => $payload['active'] ?? true,
            ]
        );

        return response()->json([
            'schemas' => ['urn:ietf:params:scim:schemas:core:2.0:User'],
            'id' => $externalId,
            'userName' => $user->email,
            'active' => $payload['active'] ?? true,
        ], 201);
    }

    public function patch(Request $request, string $id): JsonResponse
    {
        $directory = $request->attributes->get('provisioning_directory');

        $entry = ProvisionedDirectoryUser::query()
            ->where('provisioning_directory_id', $directory->id)
            ->where('external_id', $id)
            ->firstOrFail();

        $active = data_get($request->input('Operations', []), '0.value.active');

        if ($active !== null) {
            $entry->update(['active' => (bool) $active]);
        }

        return response()->json([
            'schemas' => ['urn:ietf:params:scim:schemas:core:2.0:User'],
            'id' => $entry->external_id,
            'userName' => $entry->user->email,
            'active' => $entry->active,
        ]);
    }
}
