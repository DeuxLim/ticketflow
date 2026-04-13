<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreProvisioningDirectoryRequest;
use App\Models\ProvisioningDirectory;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProvisioningDirectoryController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        return response()->json([
            'data' => ProvisioningDirectory::query()
                ->where('workspace_id', $workspace->id)
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(StoreProvisioningDirectoryRequest $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $plainToken = 'scim_'.Str::random(48);

        $directory = ProvisioningDirectory::query()->create([
            'workspace_id' => $workspace->id,
            'name' => $request->string('name')->toString(),
            'token_hash' => hash('sha256', $plainToken),
            'status' => 'active',
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'tenant.provisioning_directory.created',
            resourceType: ProvisioningDirectory::class,
            resourceId: (string) $directory->id,
            meta: ['name' => $directory->name],
            request: $request
        );

        return response()->json([
            'data' => $directory,
            'meta' => [
                'token' => $plainToken,
            ],
        ], 201);
    }
}
